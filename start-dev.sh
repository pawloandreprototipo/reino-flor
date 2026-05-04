#!/bin/bash
# Script para subir todo o ambiente de desenvolvimento

echo "🚀 Subindo ambiente Reino Flor..."

# Matar processos anteriores nas portas
echo "🔧 Liberando portas..."
pkill -f "next dev -p 3000" 2>/dev/null
pkill -f "next dev -p 3001" 2>/dev/null
pkill -f "next dev -p 3002" 2>/dev/null
sleep 2

# Verificar Docker
echo "🐳 Verificando Docker..."
docker-compose up -d

# Aguardar banco
echo "⏳ Aguardando banco de dados..."
sleep 3

# Subir os 3 apps em paralelo com logs separados
echo "▲ Subindo Storefront (3000)..."
pnpm --filter @reino-flor/storefront dev > /tmp/storefront.log 2>&1 &

echo "▲ Subindo API (3001)..."
pnpm --filter @reino-flor/api dev > /tmp/api.log 2>&1 &

echo "▲ Subindo Admin (3002)..."
pnpm --filter @reino-flor/admin dev > /tmp/admin.log 2>&1 &

echo ""
echo "✅ Processos iniciados!"
echo ""
echo "📋 URLs:"
echo "   Storefront: http://localhost:3000"
echo "   API:        http://localhost:3001"
echo "   Admin:      http://localhost:3002"
echo ""
echo "📋 Credenciais admin:"
echo "   Email: admin@reinoflor.com"
echo "   Senha: admin123"
echo "   Slug:  reino-flor"
echo ""
echo "📄 Logs:"
echo "   tail -f /tmp/api.log"
echo "   tail -f /tmp/admin.log"
echo "   tail -f /tmp/storefront.log"
echo ""
echo "⏳ Aguardando apps iniciarem (15s)..."
sleep 15

# Verificar se estão rodando
curl -s http://localhost:3001/api/health > /dev/null && echo "✅ API OK" || echo "❌ API com problema"
curl -s http://localhost:3002 > /dev/null && echo "✅ Admin OK" || echo "❌ Admin com problema"
curl -s http://localhost:3000 > /dev/null && echo "✅ Storefront OK" || echo "❌ Storefront com problema"

echo ""
echo "🎉 Ambiente pronto! Pressione Ctrl+C para parar tudo."
wait
