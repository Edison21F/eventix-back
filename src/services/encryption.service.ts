import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { key } from '../config/key';

@Injectable()
export class EncryptionService {
  private readonly algorithm = key.encryption.algorithm;
  private readonly iv = Buffer.from(key.encryption.iv, 'utf8').slice(0, 16);
  private readonly secretKey = crypto.scryptSync(key.jwt.secret, 'salt', 32);

  // Encriptar datos sensibles (tarjetas, documentos, etc.)
  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Desencriptar datos sensibles
  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Hash de contraseñas
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verificar contraseñas
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generar token aleatorio
  generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash para datos únicos (emails, documentos)
  hashUnique(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}