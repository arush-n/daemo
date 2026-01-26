import express from 'express';
import { AgentController } from './controllers/agentController';

const app = express();

app.use(express.json());

// Routes
app.post('/agent/query', AgentController.handleQuery);
app.get('/health', (req, res) => {
    res.send('Coinbase Agent is Healthy');
});

export default app;
