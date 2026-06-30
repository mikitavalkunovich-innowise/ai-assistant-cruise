import { NextResponse } from "next/server";
import {
  getTrainingRecords,
  buildTeamsNotificationPreview,
  buildEmployeeReminderPreview,
} from "@/lib/compliance/training";

export async function GET() {
  const records = getTrainingRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, managerEmail, recordId } = body;

  if (action === "manager_preview" && managerEmail) {
    const preview = buildTeamsNotificationPreview(managerEmail);
    return NextResponse.json({ preview });
  }

  if (action === "employee_preview" && recordId) {
    const records = getTrainingRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    const preview = buildEmployeeReminderPreview(record);
    return NextResponse.json({ preview });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
