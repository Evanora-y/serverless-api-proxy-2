// src/_worker.js

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

const API_MAPPING = {
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
};

const HEADERS_TO_FORWARD = [
  'authorization',
  'content-type',
  'user-agent',
  'accept',
  'accept-encoding',
  'accept-language',
  'x-requested-with'
];

// Utility functions
function extractPrefixAndRest(pathname, prefixes) {
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      return [prefix, pathname.slice(prefix.length)];
    }
  }
  return [null, null];
}

function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

function handleHomePage() {
  return new Response(
    'API代理服务正常运行中，详细使用教程请查看：https://plusai.zhangsan.link', 
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...CORS_HEADERS
      }
    }
  );
}

function handleRobotsTxt() {
  return new Response(
    'User-agent: *\nDisallow: /', 
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        ...CORS_HEADERS
      }
    }
  );
}

async function proxyRequest(request, targetUrl) {
  try {
    // Create new headers with forwarded values
    const newHeaders = new Headers();
    for (const header of HEADERS_TO_FORWARD) {
      const value = request.headers.get(header);
      if (value) {
        newHeaders.set(header, value);
      }
    }

    // Create and send the proxied request
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body
    });

    const response = await fetch(newRequest);
    
    // Add CORS headers to the response
    const responseHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Failed to fetch:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

async function handleRequest(request) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle special routes
  if (pathname === '/' || pathname === '/index.html') {
    return handleHomePage();
  }

  if (pathname === '/robots.txt') {
    return handleRobotsTxt();
  }

  // Handle API proxying
  const [prefix, rest] = extractPrefixAndRest(pathname, Object.keys(API_MAPPING));
  if (prefix) {
    const baseApiUrl = API_MAPPING[prefix];
    const targetUrl = `${baseApiUrl}${rest}`;
    return proxyRequest(request, targetUrl);
  }

  // Handle 404
  return new Response('Not Found', { 
    status: 404,
    headers: CORS_HEADERS
  });
}

// Main event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

export default {
  fetch: handleRequest
};