#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import * as OpenCC from 'opencc-js';

// 初始化繁体转简体转换器
const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });

// 需要转换的文件扩展名
const SUPPORTED_EXTENSIONS = ['.md', '.json', '.js', '.ts', '.html'];

// 需要跳过的目录
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build'];

// 需要跳过的文件
const SKIP_FILES = ['package.json', 'package-lock.json', 'tsconfig.json'];

// 特殊处理的文件路径映射
const FILE_MAPPINGS = {
  'src/public/locales/zh-TW.json': 'src/public/locales/zh-CN.json',
  'docs/js/i18n.js': 'docs/js/i18n.js' // 需要特殊处理
};

/**
 * 检查是否应该跳过该路径
 */
function shouldSkip(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // 跳过特定文件
  if (SKIP_FILES.includes(fileName)) {
    return true;
  }
  
  // 跳过特定目录
  for (const skipDir of SKIP_DIRS) {
    if (dirName.includes(skipDir)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检查文件扩展名是否支持
 */
function isSupportedFile(filePath) {
  const ext = path.extname(filePath);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * 转换文本内容，保护代码标识符
 */
function convertText(content, filePath) {
  const ext = path.extname(filePath);
  
  if (ext === '.json') {
    return convertJsonContent(content);
  } else if (ext === '.js' || ext === '.ts') {
    return convertCodeContent(content);
  } else if (ext === '.md') {
    return convertMarkdownContent(content);
  } else {
    // 默认转换
    return converter(content);
  }
}

/**
 * 转换JSON内容
 */
function convertJsonContent(content) {
  try {
    const obj = JSON.parse(content);
    const convertedObj = convertObjectValues(obj);
    return JSON.stringify(convertedObj, null, 2);
  } catch (e) {
    console.warn('JSON解析失败，使用普通文本转换');
    return converter(content);
  }
}

/**
 * 递归转换对象值
 */
function convertObjectValues(obj) {
  if (typeof obj === 'string') {
    return converter(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(convertObjectValues);
  } else if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertObjectValues(value);
    }
    return result;
  }
  return obj;
}

/**
 * 转换代码内容，只转换注释和字符串
 */
function convertCodeContent(content) {
  // 转换单行注释
  content = content.replace(/\/\/\s*(.+)$/gm, (match, comment) => {
    return match.replace(comment, converter(comment));
  });
  
  // 转换多行注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return converter(match);
  });
  
  // 转换字符串字面量（双引号）
  content = content.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, str) => {
    // 检查是否包含中文
    if (/[\u4e00-\u9fff]/.test(str)) {
      return '"' + converter(str) + '"';
    }
    return match;
  });
  
  // 转换字符串字面量（单引号）
  content = content.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match, str) => {
    // 检查是否包含中文
    if (/[\u4e00-\u9fff]/.test(str)) {
      return "'" + converter(str) + "'";
    }
    return match;
  });
  
  // 转换模板字符串
  content = content.replace(/`([^`\\]*(\\.[^`\\]*)*)`/g, (match, str) => {
    // 检查是否包含中文
    if (/[\u4e00-\u9fff]/.test(str)) {
      return '`' + converter(str) + '`';
    }
    return match;
  });
  
  return content;
}

/**
 * 转换Markdown内容
 */
function convertMarkdownContent(content) {
  // 保护代码块
  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, (match, offset) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });
  
  // 保护行内代码
  const inlineCodes = [];
  content = content.replace(/`[^`]+`/g, (match, offset) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(match);
    return placeholder;
  });
  
  // 转换其余内容
  content = converter(content);
  
  // 恢复代码块
  codeBlocks.forEach((code, index) => {
    content = content.replace(`__CODE_BLOCK_${index}__`, code);
  });
  
  // 恢复行内代码
  inlineCodes.forEach((code, index) => {
    content = content.replace(`__INLINE_CODE_${index}__`, code);
  });
  
  return content;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!shouldSkip(fullPath)) {
        scanDirectory(fullPath, files);
      }
    } else if (stat.isFile()) {
      if (!shouldSkip(fullPath) && isSupportedFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  try {
    console.log(`处理文件: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const convertedContent = convertText(content, filePath);
    
    // 检查是否有变化
    if (content !== convertedContent) {
      // 处理文件路径映射
      let outputPath = filePath;
      if (FILE_MAPPINGS[filePath]) {
        outputPath = FILE_MAPPINGS[filePath];
        console.log(`  -> 重命名为: ${outputPath}`);
      }
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, convertedContent, 'utf8');
      console.log(`  ✓ 已转换`);
      
      // 如果是重命名，删除原文件
      if (outputPath !== filePath) {
        fs.unlinkSync(filePath);
        console.log(`  ✓ 已删除原文件`);
      }
      
      return true;
    } else {
      console.log(`  - 无需转换`);
      return false;
    }
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始扫描项目文件...');
  
  const projectRoot = process.cwd();
  const files = scanDirectory(projectRoot);
  
  console.log(`找到 ${files.length} 个需要检查的文件`);
  
  let convertedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      convertedCount++;
    }
  }
  
  console.log(`\n转换完成！共转换了 ${convertedCount} 个文件`);
  
  // 特殊处理：更新i18n.js中的语言代码
  updateI18nLanguageCode();
}

/**
 * 更新i18n.js中的语言代码
 */
function updateI18nLanguageCode() {
  const i18nPath = 'docs/js/i18n.js';
  if (fs.existsSync(i18nPath)) {
    console.log('\n更新i18n.js中的语言代码...');
    let content = fs.readFileSync(i18nPath, 'utf8');
    
    // 替换语言代码
    content = content.replace(/"zh-TW"/g, '"zh-CN"');
    content = content.replace(/'zh-TW'/g, "'zh-CN'");
    content = content.replace(/zh-TW/g, 'zh-CN');
    
    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log('  ✓ 已更新语言代码');
  }
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { convertText, convertJsonContent, convertCodeContent, convertMarkdownContent };
