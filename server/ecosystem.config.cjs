// PM2 설정. 접속자 수를 메모리에서 세기 때문에 반드시 fork 모드, 인스턴스 1개
module.exports = {
  apps: [
    {
      name: "seonghyeon-live",
      script: "src/index.js",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      node_args: "--env-file=.env",
      max_memory_restart: "300M",
      kill_timeout: 6000,
      time: true,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      merge_logs: true,
    },
  ],
};
