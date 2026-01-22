from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
import io
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.json
        project_data = data.get('projectData', {})
        results = data.get('results', {})

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        elements = []
        styles = getSampleStyleSheet()

        # Estilo Customizado para Títulos
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=20
        )

        # 1. Cabeçalho Personalizado (Almeida Engenharia)
        elements.append(Paragraph(f"{project_data.get('empresa', 'Almeida Engenharia')}", title_style))
        elements.append(Paragraph(f"Proposta Técnica: {project_data.get('cliente', 'Cliente Exemplo')}", styles['Heading2']))
        elements.append(Spacer(1, 12))

        # 2. Resumo das Dimensões
        elements.append(Paragraph("Dimensões da Estrutura", styles['Heading3']))
        dim_data = [
            ['Vão:', f"{project_data.get('vao')} m", 'Comprimento:', f"{project_data.get('comprimento')} m"],
            ['Altura:', f"{project_data.get('altura')} m", 'Inclinação:', f"{project_data.get('inclinacao')}%"]
        ]
        t_dim = Table(dim_data, colWidths=[100, 100, 100, 100])
        t_dim.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 1), colors.whitesmoke),
            ('BACKGROUND', (2, 0), (2, 1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t_dim)
        elements.append(Spacer(1, 20))

        # 3. Detalhamento de Pesos e Custos
        elements.append(Paragraph("Detalhamento de Pesos e Custos", styles['Heading3']))
        cost_data = [
            ['Item', 'Valor'],
            ['Peso Total da Estrutura', f"{results.get('pesoTotal'):.2f} kg"],
            ['Peso por m²', f"{results.get('pesoM2'):.2f} kg/m²"],
            ['Custo de Material', f"R$ {results.get('custoMaterial'):,.2f}"],
            ['Custo de Montagem', f"R$ {results.get('custoMontagem'):,.2f}"],
            ['Margem de Lucro', f"R$ {results.get('valorMargem'):,.2f}"],
            ['Valor Total da Proposta', f"R$ {results.get('valorTotal'):,.2f}"]
        ]
        t_cost = Table(cost_data, colWidths=[250, 150])
        t_cost.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t_cost)
        elements.append(Spacer(1, 25))

        # 4. Cláusulas Técnicas (Inclusos e Não Inclusos)
        elements.append(Paragraph("Cláusulas Técnicas", styles['Heading3']))
        
        inclusos = [
            "Placas de base e chumbadores",
            "Terças metálicas e contraventamento de cobertura",
            "Pintura de proteção anticorrosiva"
        ]
        if project_data.get('tipologia') == 'portico':
            inclusos.append("Pórticos de alma cheia (seção variável)")
        else:
            inclusos.append("Estrutura treliçada de banzos e diagonais")

        elements.append(Paragraph("Itens Inclusos:", styles['Heading4']))
        for item in inclusos:
            elements.append(Paragraph(f"• {item}", styles['Normal']))
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Itens Não Inclusos:", styles['Heading4']))
        nao_inclusos = ["Fundações", "Paredes", "Escadas", "Instalações Elétricas"]
        for item in nao_inclusos:
            elements.append(Paragraph(f"• {item}", styles['Normal']))

        # Gerar PDF
        doc.build(elements)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Proposta_{project_data.get('cliente', 'SaaS')}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
