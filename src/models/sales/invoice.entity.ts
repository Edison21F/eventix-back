import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  invoiceNumber: string; // Ej: "INV-2023-0001"

  @OneToOne(() => Order)
  order: Order;

  @Column()
  issuerTaxId: string; // RFC/RUT/NIT

  @Column()
  customerTaxId: string;

  @Column('json')
  legalDetails: {
    issuerAddress: string;
    customerAddress: string;
    taxRate: number;
  };

  @CreateDateColumn()
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column()
  pdfUrl: string; // URL del PDF generado
}
