'use strict';

/**
 * 操作日志装饰器 - 类似AOP的自动日志记录
 * 日志在响应返回给客户端之后写入，不影响接口响应时间
 * 用法：在controller方法上使用 @withLog('操作描述') 或直接调用 withLog(fn, '操作描述')
 * 
 * @param {Function} fn - 要包装的controller方法
 * @param {String|Function} operateDesc - 操作描述，可以是字符串或函数（接收ctx和result，返回描述）
 * @param {Function} [getUserInfo] - 可选：自定义获取用户信息的函数，返回 {userGuid, userName}，默认从ctx.auth获取
 * @returns {Function} 包装后的方法
 */
function withLog(fn, operateDesc, getUserInfo) {
  return async function(...args) {
    const ctx = args[0]; // controller方法的第一个参数是ctx
    const result = await fn.apply(this, args);
    
    // 只有成功响应（code === 200）才记录日志
    if (ctx.body && ctx.body.code === 200) {
      // 在响应完成前，先准备好日志数据
      let userInfo = null;
      if (getUserInfo && typeof getUserInfo === 'function') {
        // 优先使用自定义的获取用户信息函数
        userInfo = getUserInfo(ctx, result);
      } else if (ctx.auth) {
        // 从 auth 中间件解析的 token 中获取用户信息（常规接口）
        userInfo = {
          userGuid: ctx.auth.userId,
          userName: ctx.auth.username,
        };
      } else if (ctx.body && ctx.body.data && ctx.body.data.user) {
        // 从响应数据中获取用户信息（登录接口等特殊情况）
        const user = ctx.body.data.user;
        userInfo = {
          userGuid: user.userGuid || user.USER_GUID,
          userName: user.userName || user.USER_NAME,
        };
      }
      
      if (userInfo && userInfo.userGuid) {
        // 支持动态生成操作描述
        let desc = operateDesc;
        if (typeof operateDesc === 'function') {
          desc = operateDesc(ctx, result);
        }
        
        // 保存日志数据，在响应完成后写入
        const logData = {
          userGuid: userInfo.userGuid,
          userName: userInfo.userName,
          operate: desc || '未知操作',
        };
        
        // 监听响应完成事件，在响应返回给客户端后写入日志
        const writeLog = () => {
          ctx.service.logService.createUserOperateLog(logData)
            .catch(e => {
              ctx.logger.warn('操作日志记录失败:', e && e.message);
            });
        };
        
        // 如果响应已经完成，立即写入；否则等待响应完成
        if (ctx.res.finished) {
          // 响应已完成，立即写入日志
          setImmediate(writeLog);
        } else {
          // 等待响应完成后再写入日志
          ctx.res.once('finish', writeLog);
        }
      }
    }
    
    return result;
  };
}

/**
 * 批量创建日志装饰器（用于整个controller类）
 * @param {Object} controller - controller对象
 * @param {Object} logConfig - 日志配置 { methodName: '操作描述' 或 function }
 */
function applyLogs(controller, logConfig) {
  Object.keys(logConfig).forEach(methodName => {
    if (typeof controller[methodName] === 'function') {
      controller[methodName] = withLog(controller[methodName], logConfig[methodName]);
    }
  });
}

module.exports = {
  withLog,
  applyLogs,
};

