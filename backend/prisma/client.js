const { PrismaClient } = require('@prisma/client');

const isProduction = process.env.NODE_ENV === 'production';
const prismaClientOptions = isProduction
  ? {}
  : { log: ['query', 'info', 'warn', 'error'] };

let prisma;

if (isProduction) {
  prisma = new PrismaClient(prismaClientOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaClientOptions);
  }
  prisma = global.prisma;
}

module.exports = prisma;
