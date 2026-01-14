import express from 'express';
import { AgentController } from './controllers/agentController';

const app = express();

// Middleware - Express 5 has built-in body parsing
app.use(express.json());

// Routes
// Route per documentation
console.log('[App] Registering route: POST /agent/query-stream');
app.post('/agent/query-stream', AgentController.handleQuery);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: "online", service: "stripe-finance-agent" });
});

export default app;
