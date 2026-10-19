# FR Sistema - APK Android

Aplicativo Android para preenchimento da FR (Ficha e Relatório Diário) da SMSUZ - Mogi das Cruzes/SP.

## Como funciona

O APK roda totalmente no celular do funcionário:
1. Embara o template PDF oficial da FR como recurso interno
2. O formulário coleta os dados do veículo, condutor, KM, horários, etc.
3. Ao clicar em "Gerar PDF", o app sobrepõe os textos preenchidos em cima do template original
4. O PDF é salvo no dispositivo (pasta Documents) ou baixado

Zero consumo de RAM na VPS. Funciona offline.

## Estrutura

```
fr-apk/
├── capacitor.config.json   # Configuração do Capacitor
├── package.json            # Dependências Node
├── www/
│   ├── index.html          # Formulário HTML
│   └── js/
│       └── app.js          # Lógica de geração de PDF (pdf-lib)
└── www/assets/
    └── template_FR.pdf     # Template oficial da FR (2 páginas)
```

## Como gerar o APK

O build do Android SDK não roda na VPS de 1 GB RAM. Use GitHub Actions (GitHub Codespaces ou runner hospedado):

```bash
# No seu computador ou GitHub Actions:
npm install
npx cap init
npx cap add android
npx cap open android
# No Android Studio: Build > Generate Signed Bundle / APK
```

Ou configure um workflow no `.github/workflows/build-android.yml` para buildar automaticamente.

## Tecnologias

- Capacitor (bridge WebView → Android nativo)
- pdf-lib (manipulação de PDF no cliente)
- HTML/CSS/JS puro

## Permissões necessárias

- Armazenamento (para salvar o PDF gerado)
