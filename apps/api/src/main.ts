import { bootstrap } from './bootstrap';

const { app, config, container } = await bootstrap();

app.listen(config.port, '0.0.0.0', (err?: Error) => {
  if (err) {
    container.logger.error('Error listening on port', { err });
    process.exit(1);
  }

  container.logger.info('API server listening', { port: config.port });
});
