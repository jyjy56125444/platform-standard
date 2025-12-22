'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 提示词模板工具
 * 用于读取和解析 RAG 提示词模板文件
 */
class PromptTemplates {
  /**
   * 获取模板文件路径
   * @param {String} templateName - 模板文件名（不含扩展名）
   * @returns {String} 模板文件完整路径
   */
  static getTemplatePath(templateName) {
    const appRoot = path.resolve(__dirname, '../..');
    return path.join(appRoot, 'templates', `${templateName}.md`);
  }

  /**
   * 读取模板文件内容
   * @param {String} templateName - 模板文件名（不含扩展名）
   * @returns {String} 模板内容
   */
  static readTemplate(templateName) {
    try {
      const templatePath = this.getTemplatePath(templateName);
      const content = fs.readFileSync(templatePath, 'utf8');
      return content.trim();
    } catch (error) {
      throw new Error(`读取提示词模板失败 (${templateName}): ${error.message}`);
    }
  }

  /**
   * 替换模板中的变量
   * @param {String} template - 模板内容
   * @param {Object} variables - 变量对象，如 { appName: '移动办公助手', context: '...', question: '...' }
   * @returns {String} 替换后的内容
   */
  static replaceVariables(template, variables = {}) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // 支持 {{variableName}} 格式（双花括号）
      const doubleBraceRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(doubleBraceRegex, value || '');
      // 支持 {variableName} 格式（单花括号）
      const singleBraceRegex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(singleBraceRegex, value || '');
    }
    return result;
  }

  /**
   * 生成系统提示词
   * @param {String} appName - 应用名称
   * @returns {String} 系统提示词
   */
  static generateSystemPrompt(appName = '该应用') {
    const template = this.readTemplate('rag-system-prompt');
    return this.replaceVariables(template, { appName });
  }

  /**
   * 生成用户提示词模板
   * @param {String} appName - 应用名称
   * @returns {String} 用户提示词模板（包含 {context} 和 {question} 占位符）
   */
  static generateUserPromptTemplate(appName = '该应用') {
    const template = this.readTemplate('rag-user-prompt');
    return this.replaceVariables(template, { appName });
  }

  /**
   * 生成无上下文系统提示词（当检索不到相关文档时使用）
   * @param {String} appName - 应用名称
   * @returns {String} 无上下文系统提示词
   */
  static generateNoContextSystemPrompt(appName = '该应用') {
    const template = this.readTemplate('rag-no-context-system-prompt');
    return this.replaceVariables(template, { appName });
  }

  /**
   * 生成无上下文用户提示词模板（当检索不到相关文档时使用）
   * @param {String} question - 用户问题
   * @returns {String} 无上下文用户提示词
   */
  static generateNoContextUserPrompt(question) {
    const template = this.readTemplate('rag-no-context-user-prompt');
    return this.replaceVariables(template, { question });
  }
}

module.exports = PromptTemplates;

