import { Router, type IRouter } from "express";
import { streamChatResponse } from "../lib/chat";

const chatRouter: IRouter = Router();

chatRouter.post("/chat", async (req, res): Promise<void> => {
  await streamChatResponse(req.body, req.ip, res);
});

export default chatRouter;