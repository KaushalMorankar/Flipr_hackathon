"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// lib/prisma.ts
var client_1 = require("@prisma/client");
var prisma = global.prisma || new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
exports.default = prisma;
