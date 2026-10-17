# MuscleTrack — Treino Híbrido (PWA)

Aplicativo PWA mobile-first de hipertrofia, recuperação muscular e acompanhamento de treinos, inspirado no design visual do MuscleTrack.

## 🚀 Tecnologias

- **Vite + React 19 + TypeScript**
- **Tailwind CSS** (Paleta Obsidian & Mint Neon)
- **Lucide Icons**
- **Service Worker & Web App Manifest** (PWA instalável e offline)
- **Web Audio API** (Sons esportivos sem dependências externas)
- **Canvas Confetti** (Celebração ao concluir sessões)
- **GitHub Actions** (Deploy automatizado no GitHub Pages)

## 📱 Funcionalidades

1. **Dashboard Hoje (Screen 3 & 4):**
   - Recomendação de treino inteligente do dia (Treino A, B ou C).
   - Botão de ação direta "Iniciar Treino →".
   - Visão resumida de "Seu Corpo Hoje" com porcentagens de recuperação muscular.

2. **Mapa Anatômico & Recuperação (Screen 4 & 7):**
   - Boneco anatômico interativo em SVG com alternância **Frente / Costas**.
   - Grupos musculares coloridos dinamicamente (**Verde Neon** = Pronto, **Amarelo** = Recuperando, **Vermelho** = Fadigado).
   - Medidor circular (*gauge*) de recuperação geral e previsão de horas de descanso.

3. **Sessão Ativa com Ergonomia de 1 Mão (Screen 5 & 6):**
   - Botões e caixas de texto com 48px de altura (fácil toque com o polegar).
   - Teclados numéricos nativos (`inputmode="decimal"` e `inputmode="numeric"`).
   - Suporte a séries normais, séries extras e **Drop-set no B4**.
   - Regras inteligentes de **Bi-set** (A6+A7 e C6+C7) onde o descanso só inicia após o segundo exercício.
   - Cronômetro de descanso flutuante acoplado acima da barra inferior com ajuste rápido (+15s / -15s / pausa / pronto).

4. **Evolução de Cargas & Volume (Screen 9):**
   - Gráfico de linha vetorial com gradiente brilhante para força e volume.
   - Seletor de exercício para acompanhar a sobrecarga progressiva.

5. **Histórico & Backup:**
   - Lista reversa de sessões com detalhamento completo.
   - Exportação e importação de backup em arquivo `.json`.

---

## 💻 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Gerar build de produção
npm run build

# Testar build local
npm run preview
```

---

## 🌐 Como Subir no GitHub Pages

O projeto já está configurado com `base: './'` no Vite e com o workflow pronto em `.github/workflows/deploy.yml`.

1. Crie um repositório no seu GitHub (ex.: `academia` ou `muscletrack`).
2. Vincule e envie seu código:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```
3. No seu repositório no GitHub:
   - Vá em **Settings** > **Pages**.
   - Em **Build and deployment** > **Source**, selecione: **GitHub Actions**.
4. O GitHub Actions executará o deploy automaticamente e disponibilizará o link do seu PWA (ex: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`)!
