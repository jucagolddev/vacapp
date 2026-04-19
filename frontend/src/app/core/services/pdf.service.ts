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
   * Helper para obtener el constructor de jsPDF de forma resiliente.
   */
  private async getJsPDFConstructor() {
    const jsPDFModule = await import('jspdf');
    // En entornos Vite/ESM, jsPDF puede estar en .jsPDF o en .default
    return jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;
  }

  /**
   * Helper para obtener la función autoTable de forma resiliente.
   */
  private async getAutoTableFunction() {
    const autoTableModule = await import('jspdf-autotable');
    return autoTableModule.default || autoTableModule;
  }

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
    const jsPDF = await this.getJsPDFConstructor();
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
    const autoTable = await this.getAutoTableFunction();
    const forestGreen: [number, number, number] = [27, 67, 50]; // Sincronizado con variables.scss (#1b4332)
    const earthBrown: [number, number, number] = [88, 47, 14]; // Sincronizado con variables.scss (#582f0e)
    const wheatBg: [number, number, number] = [254, 250, 224]; // Sincronizado con variables.scss (#fefae0)

    if (title) {
      doc.setFontSize(16);
      doc.setTextColor(forestGreen[0], forestGreen[1], forestGreen[2]);
      const startY = options.startY || 20;
      doc.text(title, 14, startY - 5);
    }

    try {
      autoTable(doc, {
        head: headers,
        body: body,
        theme: 'striped',
        headStyles: { 
          fillColor: forestGreen,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          font: 'helvetica'
        },
        alternateRowStyles: { 
          fillColor: [250, 248, 235] // Un beige muy claro
        },
        margin: { top: 25 },
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
    const jsPDF = await this.getJsPDFConstructor();
    return new jsPDF();
  }

  /**
   * Acceso seguro a la posición vertical final de la última tabla.
   */
  getLastY(doc: any): number {
    return doc.lastAutoTable?.finalY || 40;
  }
}
