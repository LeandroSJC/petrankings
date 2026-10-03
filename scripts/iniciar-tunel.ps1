# ==============================================================================
# PetRankings — Túnel SSH Seguro para o PostgreSQL na Oracle Cloud
# Redireciona a porta local 5433 para a porta 5432 do PostgreSQL no servidor
# ==============================================================================

Write-Host "🔒 [PetRankings] Iniciando túnel SSH seguro com o PostgreSQL da Oracle..." -ForegroundColor Cyan
Write-Host "📡 Mapeamento ativo: localhost:5433 -> 168.138.144.63:5432 (Oracle Cloud)" -ForegroundColor Green
Write-Host "💡 Deixe esta janela aberta enquanto roda os scripts de cadastro ou o Prisma Studio." -ForegroundColor Yellow
Write-Host "⏹️ Pressione Ctrl+C para fechar o túnel quando terminar." -ForegroundColor Gray
Write-Host ""

ssh -i "D:\Projetos\ssh-key-2026-10-03.key" -L 5433:127.0.0.1:5432 -N ubuntu@168.138.144.63
