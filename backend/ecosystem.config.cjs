module.exports = {
  apps: [
    {
      name: 'dentisterie-api',
      script: 'dist/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_type: 'json',
      // Metrics
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: 'dentisterie-api-dev',
      script: 'node_modules/.bin/tsx',
      args: 'watch src/server.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      error_file: './logs/pm2-dev-error.log',
      out_file: './logs/pm2-dev-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
