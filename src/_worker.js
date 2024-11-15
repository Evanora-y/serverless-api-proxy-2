addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // 添加通用的CORS响应头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  if (pathname === '/' || pathname === '/index.html') {
    return new Response('API代理服务正常运行中，详细使用教程请查看：https://plusai.zhangsan.link', {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders
      }
    });
  }

  if(pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders
      }
    });
  }

  const apiMapping = {
    '/discord': 'https://discord.com/api',
    '/telegram': 'https://api.telegram.org',
    '/openai': 'https://api.openai.com',
    '/claude': 'https://api.anthropic.com',
    '/gemini': 'https://generativelanguage.googleapis.com',
    '/meta': 'https://www.meta.ai/api',
    '/groq': 'https://api.groq.com',
    '/x': 'https://api.x.ai',
    '/cohere': 'https://api.cohere.ai',
    '/huggingface': 'https://api-inference.huggingface.co',
    '/together': 'https://api.together.xyz',
    '/novita': 'https://api.novita.ai',
    '/portkey': 'https://api.portkey.ai',
    '/fireworks': 'https://api.fireworks.ai',
    '/openrouter': 'https://openrouter.ai/api'
  }
  
  const [prefix, rest] = extractPrefixAndRest(pathname, Object.keys(apiMapping));
  if (prefix) {
    const baseApiUrl = apiMapping[prefix];
    const targetUrl = `${baseApiUrl}${rest}`;
    try {
      // 创建新的请求头，保留原始请求的关键头部
      const newHeaders = new Headers();
      // 复制原始请求的认证和内容类型头部
      const headersToForward = [
        'authorization',
        'content-type',
        'user-agent',
        'accept',
        'accept-encoding',
        'accept-language',
        'x-requested-with'
      ];
      
      for (const header of headersToForward) {
        const value = request.headers.get(header);
        if (value) {
          newHeaders.set(header, value);
        }
      }

      const newRequest = new Request(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.body
      });

      const response = await fetch(newRequest);
      
      // 创建新的响应头，包含CORS头部
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // 返回带有CORS头部的响应
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('Failed to fetch:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // 如果没有匹配的路由，返回404
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  });
}

// 处理 OPTIONS 预检请求的函数
function handleOptions(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

function extractPrefixAndRest(pathname, prefixes) {
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      return [prefix, pathname.slice(prefix.length)];
    }
  }
  return [null, null];
}
