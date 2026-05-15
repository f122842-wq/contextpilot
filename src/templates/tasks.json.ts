export const tasksTemplate = [
  {
    id: "1",
    title: "Define project scope and architecture",
    status: "pending",
    dependsOn: [],
    assignedTo: null,
    notes: "",
  },
];

export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dependsOn: string[];
  assignedTo: string | null;
  notes: string;
}
