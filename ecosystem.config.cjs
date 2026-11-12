// 자체 서버 운영용 PM2 설정.
// Next.js와 실시간 서버는 외부에 직접 노출하지 않고 Cloudflare Tunnel만 사용한다.
module.exports = {
  apps: [
    {
      name: "seonghyeon-web",
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 127.0.0.1 --port 3000",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "700M",
      kill_timeout: 15000,
      listen_timeout: 15000,
      time: true,
      out_file: "logs/web-out.log",
      error_file: "logs/web-error.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      // 접속자 수와 합장 수가 메모리에 있으므로 반드시 단일 프로세스로 실행한다.
      name: "seonghyeon-live",
      script: "src/index.js",
      cwd: `${__dirname}/server`,
      exec_mode: "fork",
      instances: 1,
      node_args: "--env-file=.env",
      max_memory_restart: "300M",
      kill_timeout: 6000,
      time: true,
      out_file: "logs/live-out.log",
      error_file: "logs/live-error.log",
      merge_logs: true,
    },
  ],
};
