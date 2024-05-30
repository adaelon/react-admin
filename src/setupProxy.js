const proxy = require('http-proxy-middleware');
const proxyConfig = require('./setupProxyConfig.json');
const path = require('path');   
const fs = require('fs');
const bodyParser = require('body-parser'); // 引入 body-parser

// 同步修改测试环境NG代理
modifyTestNg();

// 前端web服务代理配置
module.exports = function (app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    console.log(bodyParser.json())
    app.use((req, res, next) => {
        const isMockRequest = req.url.startsWith('/mock/');
        
        if (isMockRequest) {
            console.log(`Mock request intercepted: ${req.url}`);
            config.baseURL = ''; 
            
            // 这里可以添加对 mock 数据的处理逻辑
            res.status(200).json({ message: `Mock response for ${req.url}` });
            return;
        }
        next();
    });
    app.use(proxy('/api',
        {
            target: 'http://localhost:8081/', // 目标服务器
            pathRewrite: {
                '^/api': '', // 如果后端接口无前缀，可以通过这种方式去掉
            },
            changeOrigin: true,
            secure: false, // 是否验证证书
            ws: true, // 启用websocket
        },
    ));
    proxyConfig
        .filter((item) => !item.disabled)
        .forEach(({ baseUrl, target }) => {
            app.use(
                proxy(baseUrl, {
                    target,
                    pathRewrite: {
                        ['^' ]: '',
                    },
                    changeOrigin: true,
                    secure: false, // 是否验证证书
                    ws: true, // 启用websocket
                    // 作为子系统时，需要设置允许跨域
                    // onProxyRes(proxyRes, req, res) {
                    //     proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                    //     proxyRes.headers['Access-Control-Allow-Methods'] = '*';
                    //     proxyRes.headers['Access-Control-Allow-Headers'] = '*';
                    // },
                }),
            );
        });

    

    app.use(
        proxy('/portal', {
            target: 'http://172.16.143.44:32328', // 测试门户后端
            pathRewrite: {
                '^/portal': '',
            },
            changeOrigin: true,
            secure: false, // 是否验证证书
            ws: true, // 启用websocket
        }),
        
    );
    
    
};

function modifyTestNg() {
    const ngConfigPath = path.resolve(__dirname, '..', 'deploy', 'rancher', 'nginx.conf');
    const ngConfig = fs.readFileSync(ngConfigPath, 'UTF-8');
    const locations = proxyConfig
        .filter((item) => !item.disabled)
        .map(({ name, baseUrl, target }) => {
            return `
    # 代理ajax请求 ${name}
    location ^~${baseUrl} {
        rewrite ^${baseUrl}/(.*)$ /$1 break; # 如果后端接口不是统一以api开头，去掉api前缀
        proxy_pass ${target};
        proxy_set_header Host  $http_host;
        proxy_set_header Connection close;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Server $host;
    }
        `;
        })
        .join('');
    const startIndex = ngConfig.indexOf('# 代理ajax请求');

    const nextNgConfig = `
${ngConfig.substring(0, startIndex)}${locations.trim()}
}
    `;
    fs.writeFileSync(ngConfigPath, nextNgConfig.trim(), 'UTF-8');
}
