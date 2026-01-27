import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Importa o dotenv para ler o .env

// Agora lê a MESMA chave secreta que o index.ts
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_padrao_de_emergencia';

// Vamos estender a interface Request do Express para adicionar nossa propriedade 'usuario'
export interface RequestComUsuario extends Request {
    usuario?: any; // Usamos 'any' por simplicidade, mas poderia ser uma interface de Usuário
}

export const verificarToken = (req: RequestComUsuario, res: Response, next: NextFunction) => {
    // O token geralmente é enviado no cabeçalho 'Authorization' no formato 'Bearer TOKEN'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega apenas a parte do token

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado: token não fornecido.' }); // 401 Unauthorized
    }

    try {
        // Verifica se o token é válido usando nosso segredo
        const payload = jwt.verify(token, JWT_SECRET);
        
        // Se for válido, adicionamos o payload (dados do usuário) à requisição
        req.usuario = payload;

        // Chama a próxima função no ciclo da requisição (nossa rota de despesas)
        next();

    } catch (err) {
        // Se o token for inválido (assinatura errada, expirado, etc.)
        res.status(403).json({ error: 'Token inválido.' }); // 403 Forbidden
    }
};

// Middleware para verificar o PAPEL do usuário
export const verificarPapel = (papeisPermitidos: string[]) => {
    return (req: RequestComUsuario, res: Response, next: NextFunction) => {
        
        // Pegamos o usuário que foi adicionado à requisição pelo middleware anterior (verificarToken)
        const usuario = req.usuario;

        // Se não houver usuário ou se o papel dele não estiver na lista de permitidos
        if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
            // 403 Forbidden - significa que entendemos quem você é, mas você não tem permissão.
            return res.status(403).json({ error: 'Acesso negado: você não tem permissão para realizar esta ação.' });
        }

        // Se o papel for permitido, continue para a próxima função (a rota)
        next();
    };
};