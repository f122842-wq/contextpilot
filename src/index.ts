#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./cli/commands/init.js";
import { statusCommand } from "./cli/commands/status.js";
import { checkpointCommand } from "./cli/commands/checkpoint.js";
import { resumeCommand } from "./cli/commands/resume.js";
import { planCommand } from "./cli/commands/plan.js";

const program = new Command();

program
  .name("contextpilot")
  .description("AI coding assistant project memory manager — prevents context decay in long projects")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(checkpointCommand);
program.addCommand(resumeCommand);
program.addCommand(planCommand);

program.parse();
