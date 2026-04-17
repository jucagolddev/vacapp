import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para la generación de reportes PDF.
 * Utiliza Carga Dinámica (Lazy Loading) para evitar bloqueos en el arranque de la aplicación 
 * y resolver conflictos de pre-bundado de Vite.
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService {

  /**
   * Genera un PDF profesional con una tabla de datos de forma asíncrona.
   */
  async generateTablePDF(
    title: string, 
    headers: string[][], 
    body: any[], 
    fileName: string,
    options: any = {}
  ) {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    await this.addTableToDoc(doc, title, headers, body, options);
    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
  }

  /**
   * Agrega una tabla a un documento existente de forma asíncrona.
   */
  async addTableToDoc(
    doc: any,
    title: string,
    headers: string[][],
    body: any[],
    options: any = {}
  ) {
    const autoTable = (await import('jspdf-autotable')).default;
    const forestGreen: [number, number, number] = [43, 83, 41];
    const wheatBackground: [number, number, number] = [245, 245, 245];

    if (title) {
      doc.setFontSize(14);
      doc.setTextColor(forestGreen[0], forestGreen[1], forestGreen[2]);
      doc.text(title, options.margin?.toString().includes('left') ? 14 : 14, (options.startY as number || 20) - 5);
    }

    try {
      autoTable(doc, {
        head: headers,
        body: body,
        theme: 'striped',
        headStyles: { 
          fillColor: forestGreen,
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          font: 'helvetica'
        },
        alternateRowStyles: { 
          fillColor: wheatBackground 
        },
        ...options
      });
    } catch (error) {
      console.error('Error al generar tabla en PDF:', error);
    }
  }

  /**
   * Permite obtener el objeto doc de forma asíncrona para casos complejos.
   */
  async getNewDoc(): Promise<any> {
    const jsPDF = (await import('jspdf')).default;
    return new jsPDF();
  }

  /**
   * Acceso seguro a la posición vertical final de la última tabla.
   */
  getLastY(doc: any): number {
    return doc.lastAutoTable?.finalY || 40;
  }
}
