import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import pinoHttp from 'pino-http';

export function applyMiddleware(app: Express): void {
  // The API is served behind Replit's forwarding proxy. Trust the first
  // proxy hop so rate limiting can use the original client address.
  app.set('trust proxy', 1);

  app.use(
    pinoHttp({
      redact: ['req.headers.authorization', 'req.headers.cookie', "res.headers['set-cookie']"],
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split('?')[0],
          };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    })
  );

  // Security headers
  app.use(helmet());

  // CORS - allow all origins for now, configure for production
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting - 300 requests per minute
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
      },
    })
  );

  // Slow down after 150 requests
  app.use(
    slowDown({
      windowMs: 60_000,
      delayAfter: 150,
      delayMs: () => 250,
    })
  );
}
