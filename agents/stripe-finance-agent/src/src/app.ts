import express from 'express';
import bodyParser from 'body-parser';
import { AgentController } from './controllers/agentController';

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.post('/agent/query', AgentController.handleQuery);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: "online", service: "stripe-finance-agent" });
});

export default app;
