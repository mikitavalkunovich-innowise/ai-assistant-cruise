import trainingData from "@/data/mock/sap-training.json";
import type { TrainingRecord } from "@/lib/types";

export function getTrainingRecords(): TrainingRecord[] {
  const today = new Date();
  return trainingData.map((record) => {
    const dueDate = new Date(record.dueDate);
    const diffMs = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      ...record,
      daysOverdue,
      status: daysOverdue > 0 ? "overdue" : "expiring",
    } as TrainingRecord;
  });
}

export function getTrainingByManager(managerEmail: string): TrainingRecord[] {
  return getTrainingRecords().filter((r) => r.managerEmail === managerEmail);
}

export function buildTeamsNotificationPreview(managerEmail: string): string {
  const records = getTrainingByManager(managerEmail);
  if (records.length === 0) {
    return "No overdue certifications found for your team.";
  }

  const grouped = records.reduce(
    (acc, r) => {
      if (!acc[r.employeeName]) acc[r.employeeName] = [];
      acc[r.employeeName].push(r);
      return acc;
    },
    {} as Record<string, TrainingRecord[]>
  );

  let message = `🚨 **NCL Training Compliance Alert**\n\n`;
  message += `Dear Manager,\n\nThe following team members have overdue or expiring mandatory safety certifications:\n\n`;

  for (const [employee, certs] of Object.entries(grouped)) {
    message += `**${employee}**\n`;
    for (const cert of certs) {
      const status = cert.daysOverdue > 0 ? `${cert.daysOverdue} days overdue` : "expiring soon";
      message += `  • ${cert.certification} — due ${cert.dueDate} (${status})\n`;
    }
    message += `\n`;
  }

  message += `\nPlease ensure certifications are renewed before the next audit.\n`;
  message += `[Open SAP SuccessFactors Learning Portal](https://performancemanager.successfactors.com)\n\n`;
  message += `_Automated notification from NCL Compliance Auditor (Agent 1B)_`;

  return message;
}

export function buildEmployeeReminderPreview(record: TrainingRecord): string {
  const status = record.daysOverdue > 0 ? `${record.daysOverdue} days overdue` : "expiring soon";
  return `📋 **Certification Reminder**

Dear ${record.employeeName},

Your mandatory certification **${record.certification}** is ${status}.

**Due date:** ${record.dueDate}

Please complete your renewal in SAP SuccessFactors Learning Portal as soon as possible.

[Open Learning Portal](https://performancemanager.successfactors.com)

_Automated reminder from NCL Compliance Auditor (Agent 1B)_`;
}
