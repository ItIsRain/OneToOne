import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { clientOnboardingWelcomeEmail, onboardingStepEmail } from "@/lib/email-templates";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Get onboarding for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify client belongs to tenant
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: onboarding } = await supabase
      .from("client_onboardings")
      .select("*, client_onboarding_templates(name)")
      .eq("client_id", clientId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // Also fetch available templates for starting onboarding
    const { data: templates } = await supabase
      .from("client_onboarding_templates")
      .select("id, name, description, steps, is_default")
      .eq("tenant_id", profile.tenant_id)
      .order("is_default", { ascending: false });

    return NextResponse.json({
      onboarding: onboarding || null,
      templates: templates || [],
    });
  } catch (error) {
    console.error("Get client onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Start onboarding for a client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify client belongs to tenant
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if onboarding already exists
    const { data: existing } = await supabase
      .from("client_onboardings")
      .select("id")
      .eq("client_id", clientId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Onboarding already exists for this client" }, { status: 409 });
    }

    const body = await request.json();
    let steps: OnboardingStep[] = [];

    // Load from template or use custom steps
    if (body.template_id) {
      const { data: template } = await supabase
        .from("client_onboarding_templates")
        .select("steps")
        .eq("id", body.template_id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      steps = (template.steps as OnboardingStep[]).map((step, index) => ({
        ...step,
        id: `step-${index + 1}-${Date.now()}`,
        status: "pending",
        completed_at: null,
        completed_by: null,
      }));
    } else if (Array.isArray(body.steps) && body.steps.length > 0) {
      steps = body.steps.map((step: OnboardingStep, index: number) => ({
        ...step,
        id: `step-${index + 1}-${Date.now()}`,
        status: "pending",
        completed_at: null,
        completed_by: null,
      }));
    } else {
      // Use default steps
      steps = getDefaultSteps();
    }

    const { data: onboarding, error } = await supabase
      .from("client_onboardings")
      .insert({
        tenant_id: profile.tenant_id,
        client_id: clientId,
        template_id: body.template_id || null,
        status: "in_progress",
        steps,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ onboarding }, { status: 201 });
  } catch (error) {
    console.error("Start client onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update onboarding step status or overall status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch client info for sending emails
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, email, company")
      .eq("id", clientId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch tenant info for email context
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", profile.tenant_id)
      .single();

    const body = await request.json();

    // Get current onboarding
    const { data: onboarding } = await supabase
      .from("client_onboardings")
      .select("*")
      .eq("client_id", clientId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!onboarding) {
      return NextResponse.json({ error: "Onboarding not found" }, { status: 404 });
    }

    const steps = onboarding.steps as OnboardingStep[];
    const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown";
    const companyName = tenant?.name || "Our Team";

    // Update a specific step
    if (body.step_id && body.step_status) {
      const stepIndex = steps.findIndex((s: OnboardingStep) => s.id === body.step_id);
      if (stepIndex === -1) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }

      const step = steps[stepIndex];

      // Send email if this is an email-type step being completed and send_email flag is set
      let emailSent = false;
      if (step.type === "email" && body.step_status === "completed" && body.send_email && client.email) {
        try {
          const isWelcomeEmail = step.title.toLowerCase().includes("welcome");
          const html = isWelcomeEmail
            ? clientOnboardingWelcomeEmail({
                clientName: client.name || "there",
                senderName: userName,
                companyName,
              })
            : onboardingStepEmail({
                clientName: client.name || "there",
                senderName: userName,
                companyName,
                stepTitle: step.title,
                stepDescription: step.description,
              });

          emailSent = await sendEmail({
            to: client.email,
            subject: isWelcomeEmail
              ? `Welcome to ${companyName}!`
              : `${step.title} — ${companyName}`,
            html,
            tenantId: profile.tenant_id,
          });
        } catch (emailError) {
          console.error("Failed to send onboarding email:", emailError);
        }
      }

      steps[stepIndex] = {
        ...steps[stepIndex],
        status: body.step_status,
        completed_at: body.step_status === "completed" ? new Date().toISOString() : null,
        completed_by: body.step_status === "completed" ? userName : null,
        notes: body.notes !== undefined ? body.notes : steps[stepIndex].notes,
      };

      // Check if all steps are completed
      const allComplete = steps.every((s: OnboardingStep) => s.status === "completed" || s.status === "skipped");
      const newStatus = allComplete ? "completed" : "in_progress";

      const { data: updated, error } = await supabase
        .from("client_onboardings")
        .update({
          steps,
          status: newStatus,
          completed_at: allComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", onboarding.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ onboarding: updated, emailSent });
    }

    // Update overall status (e.g., pause/resume)
    if (body.status) {
      const { data: updated, error } = await supabase
        .from("client_onboardings")
        .update({
          status: body.status,
          completed_at: body.status === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", onboarding.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ onboarding: updated });
    }

    return NextResponse.json({ error: "No update specified" }, { status: 400 });
  } catch (error) {
    console.error("Update client onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Remove onboarding (reset)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("client_onboardings")
      .delete()
      .eq("client_id", clientId)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Types
interface OnboardingStep {
  id?: string;
  title: string;
  description?: string;
  type: string;
  status?: string;
  completed_at?: string | null;
  completed_by?: string | null;
  notes?: string | null;
}

// Default onboarding steps when no template is provided
function getDefaultSteps(): OnboardingStep[] {
  return [
    {
      id: `step-1-${Date.now()}`,
      title: "Send Welcome Email",
      description: "Send a welcome email introducing the team and next steps",
      type: "email",
      status: "pending",
      completed_at: null,
      completed_by: null,
    },
    {
      id: `step-2-${Date.now()}`,
      title: "Send Intake Form",
      description: "Send an intake questionnaire to collect project requirements",
      type: "form",
      status: "pending",
      completed_at: null,
      completed_by: null,
    },
    {
      id: `step-3-${Date.now()}`,
      title: "Contract / NDA Signing",
      description: "Send contract or NDA for the client to review and sign",
      type: "contract",
      status: "pending",
      completed_at: null,
      completed_by: null,
    },
    {
      id: `step-4-${Date.now()}`,
      title: "Schedule Kickoff Meeting",
      description: "Book an initial kickoff call with the client",
      type: "meeting",
      status: "pending",
      completed_at: null,
      completed_by: null,
    },
    {
      id: `step-5-${Date.now()}`,
      title: "Setup Portal Access",
      description: "Create client portal account and share access credentials",
      type: "access",
      status: "pending",
      completed_at: null,
      completed_by: null,
    },
  ];
}
