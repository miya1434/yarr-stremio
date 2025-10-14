import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware for YARR!
 */

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  message: {
    error: "Too many requests, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const streamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 stream requests per minute per IP
  message: {
    error: "Too many stream requests, please slow down",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't limit local requests
    const ip = req.ip || req.connection.remoteAddress;
    return ip === "127.0.0.1" || ip === "::1" || ip?.startsWith("192.168.");
  },
});

export const catalogLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 catalog requests per 5 minutes per IP
  message: {
    error: "Too many catalog requests",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

