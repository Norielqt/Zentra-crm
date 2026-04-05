<?php

namespace Database\Seeders;

use App\Models\Automation;
use App\Models\Client;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Company ──────────────────────────────────────────────────
        $company = Company::firstOrCreate(
            ['name' => 'Zentra Demo Co.'],
            ['name' => 'Zentra Demo Co.']
        );

        // ── Users ─────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'demo.zentracrm@gmail.com'],
            [
                'name'       => 'Alex Rivera',
                'email'      => 'demo.zentracrm@gmail.com',
                'password'   => Hash::make('demo.zentracrm'),
                'role'       => 'admin',
                'company_id' => $company->id,
            ]
        );

        $member = User::firstOrCreate(
            ['email' => 'sarah.demo@zentracrm.com'],
            [
                'name'       => 'Sarah Chen',
                'email'      => 'sarah.demo@zentracrm.com',
                'password'   => Hash::make('demo.zentracrm'),
                'role'       => 'member',
                'company_id' => $company->id,
            ]
        );

        // ── Leads ─────────────────────────────────────────────────────
        $leadsData = [
            // New Lead
            ['name' => 'Marcus Johnson',    'email' => 'marcus.j@techwave.io',    'phone' => '+1 555-0101', 'source' => 'Website',          'status' => 'New Lead',  'deal_value' => 12000,  'assigned_user_id' => $admin->id,  'notes' => 'Reached out through contact form. Interested in enterprise plan.'],
            ['name' => 'Priya Nair',        'email' => 'priya.nair@influx.co',    'phone' => '+1 555-0102', 'source' => 'LinkedIn',         'status' => 'New Lead',  'deal_value' => 8500,   'assigned_user_id' => $member->id, 'notes' => 'Connected on LinkedIn. Needs a demo of the pipeline module.'],
            ['name' => 'Daniel Reyes',      'email' => 'd.reyes@constructly.com', 'phone' => '+1 555-0103', 'source' => 'Cold Call',        'status' => 'New Lead',  'deal_value' => 5000,   'assigned_user_id' => $admin->id,  'notes' => 'Called in during outreach campaign. Requested pricing sheet.'],
            // Contacted
            ['name' => 'Sofia Müller',      'email' => 'sofia.m@growthlab.de',    'phone' => '+49 30 5550104', 'source' => 'Referral',      'status' => 'Contacted', 'deal_value' => 22000,  'assigned_user_id' => $admin->id,  'notes' => 'Referred by existing client. Had intro call. Very interested.'],
            ['name' => 'James Okafor',      'email' => 'j.okafor@nexusretail.ng', 'phone' => '+234 800 5550105', 'source' => 'Email Campaign', 'status' => 'Contacted', 'deal_value' => 9800, 'assigned_user_id' => $member->id, 'notes' => 'Responded to Q2 email campaign. Scheduled a follow-up call.'],
            ['name' => 'Lena Bergström',    'email' => 'lena.b@nordicSaaS.se',   'phone' => '+46 8 5550106', 'source' => 'Website',         'status' => 'Contacted', 'deal_value' => 14500,  'assigned_user_id' => $admin->id,  'notes' => 'Downloaded whitepaper. Had first call — good budget fit.'],
            // Qualified
            ['name' => 'Carlos Mendoza',    'email' => 'c.mendoza@agroplex.mx',   'phone' => '+52 55 5550107', 'source' => 'Referral',      'status' => 'Qualified', 'deal_value' => 31000,  'assigned_user_id' => $admin->id,  'notes' => 'Qualified after discovery call. Decision maker confirmed. Strong fit.'],
            ['name' => 'Yuki Tanaka',       'email' => 'yuki.t@smartflow.jp',     'phone' => '+81 3 5550108', 'source' => 'LinkedIn',        'status' => 'Qualified', 'deal_value' => 18000,  'assigned_user_id' => $member->id, 'notes' => 'Clear pain points. Currently using spreadsheets — low friction switch.'],
            // Proposal
            ['name' => 'Ingrid Larsson',    'email' => 'ingrid.l@finvolve.se',    'phone' => '+46 70 5550109', 'source' => 'Cold Call',      'status' => 'Proposal',  'deal_value' => 47000,  'assigned_user_id' => $admin->id,  'notes' => 'Proposal sent 3 days ago. Awaiting sign-off from CFO.'],
            ['name' => 'Amara Diallo',      'email' => 'amara.d@luminary.sn',     'phone' => '+221 77 5550110', 'source' => 'Website',      'status' => 'Proposal',  'deal_value' => 25000,  'assigned_user_id' => $admin->id,  'notes' => 'Signed NDA. Proposal under legal review. High priority.'],
            // Closed
            ['name' => 'Tom Fischer',       'email' => 'tom.f@buildright.de',     'phone' => '+49 89 5550111', 'source' => 'Referral',       'status' => 'Closed',    'deal_value' => 38000,  'assigned_user_id' => $admin->id,  'notes' => 'Deal closed. Contract signed. Onboarding scheduled for next week.'],
            ['name' => 'Nina Kovač',        'email' => 'nina.k@datapulse.hr',     'phone' => '+385 91 5550112', 'source' => 'LinkedIn',     'status' => 'Closed',    'deal_value' => 21000,  'assigned_user_id' => $member->id, 'notes' => 'Closed after 3 demos. Annual contract. Upsell opportunity in Q3.'],
            ['name' => 'Raj Patel',         'email' => 'raj.p@cloudscale.in',     'phone' => '+91 98 5550113', 'source' => 'Email Campaign', 'status' => 'Closed',   'deal_value' => 15500,  'assigned_user_id' => $admin->id,  'notes' => 'Fast close — 10-day sales cycle. Great reference account.'],
        ];

        $leads = [];
        foreach ($leadsData as $data) {
            $leads[] = Lead::firstOrCreate(
                ['email' => $data['email'], 'company_id' => $company->id],
                array_merge($data, ['company_id' => $company->id])
            );
        }

        // ── Clients (from closed leads) ───────────────────────────────
        $closedLeads = collect($leads)->filter(fn($l) => $l->status === 'Closed');

        $clientsData = [
            ['lead' => 'tom.f@buildright.de',   'notes' => 'Premium client. Prefers weekly check-ins. Contact Tom or his PA Klara.'],
            ['lead' => 'nina.k@datapulse.hr',   'notes' => 'Annual contract. QBR scheduled for July. Considering adding 5 seats.'],
            ['lead' => 'raj.p@cloudscale.in',   'notes' => 'Fast-growing startup. Likely to upgrade to enterprise tier by Q4.'],
        ];

        $clients = [];
        foreach ($clientsData as $cd) {
            $lead = $closedLeads->firstWhere('email', $cd['lead']);
            if (!$lead) continue;
            $clients[] = Client::firstOrCreate(
                ['email' => $lead->email, 'company_id' => $company->id],
                [
                    'company_id'       => $company->id,
                    'assigned_user_id' => $lead->assigned_user_id,
                    'lead_id'          => $lead->id,
                    'name'             => $lead->name,
                    'email'            => $lead->email,
                    'phone'            => $lead->phone,
                    'notes'            => $cd['notes'],
                ]
            );
        }

        // ── Tasks ─────────────────────────────────────────────────────
        $tasksData = [
            // Todo
            ['title' => 'Send pricing proposal to Ingrid Larsson',    'description' => 'Attach updated enterprise pricing PDF and follow up on CFO review.', 'status' => 'Todo',        'due_date' => now()->addDays(2),  'assigned_user_id' => $admin->id,  'lead_id' => $this->leadByEmail($leads, 'ingrid.l@finvolve.se')],
            ['title' => 'Schedule product demo for Marcus Johnson',    'description' => 'Coordinate 30-min demo call covering pipeline and automation modules.', 'status' => 'Todo',       'due_date' => now()->addDays(3),  'assigned_user_id' => $admin->id,  'lead_id' => $this->leadByEmail($leads, 'marcus.j@techwave.io')],
            ['title' => 'Research Amara Diallo\'s industry verticals', 'description' => 'Prepare competitive landscape notes before Amara\'s legal review is done.', 'status' => 'Todo',  'due_date' => now()->addDays(1),  'assigned_user_id' => $admin->id,  'lead_id' => $this->leadByEmail($leads, 'amara.d@luminary.sn')],
            ['title' => 'Prepare Q2 outreach email template',          'description' => 'Write email copy targeting SaaS startups in EMEA region.', 'status' => 'Todo',                   'due_date' => now()->addDays(5),  'assigned_user_id' => $member->id, 'lead_id' => null],
            // In Progress
            ['title' => 'Follow up with Sofia Müller after intro call','description' => 'Send recap email + attach case study PDF. Propose discovery call date.', 'status' => 'In Progress', 'due_date' => now()->addDays(1), 'assigned_user_id' => $admin->id, 'lead_id' => $this->leadByEmail($leads, 'sofia.m@growthlab.de')],
            ['title' => 'Qualify Carlos Mendoza requirements',         'description' => 'Document integration needs with their ERP. Confirm decision timeline.',  'status' => 'In Progress', 'due_date' => now()->addDays(2), 'assigned_user_id' => $admin->id, 'lead_id' => $this->leadByEmail($leads, 'c.mendoza@agroplex.mx')],
            ['title' => 'Onboard Tom Fischer — BuildRight GmbH',       'description' => 'Set up company workspace, invite their team of 8, run kickoff session.', 'status' => 'In Progress', 'due_date' => now()->addDays(4), 'assigned_user_id' => $admin->id, 'client_id' => $this->clientByEmail($clients, 'tom.f@buildright.de')],
            ['title' => 'Draft upsell proposal for Nina Kovač',        'description' => 'Prepare 5-seat upgrade proposal with volume discount for Q3 review.',    'status' => 'In Progress', 'due_date' => now()->addDays(7), 'assigned_user_id' => $member->id, 'client_id' => $this->clientByEmail($clients, 'nina.k@datapulse.hr')],
            // Done
            ['title' => 'Initial call with James Okafor',              'description' => 'Completed intro call. Identified pain points. Scheduled follow-up.',     'status' => 'Done', 'due_date' => now()->subDays(1), 'assigned_user_id' => $member->id, 'lead_id' => $this->leadByEmail($leads, 'j.okafor@nexusretail.ng')],
            ['title' => 'Send contract to Raj Patel',                  'description' => 'Sent DocuSign contract. Signed and returned within 24 hours.',           'status' => 'Done', 'due_date' => now()->subDays(3), 'assigned_user_id' => $admin->id,  'client_id' => $this->clientByEmail($clients, 'raj.p@cloudscale.in')],
            ['title' => 'LinkedIn outreach batch — April',             'description' => 'Sent 40 connection requests. 12 accepted, 3 replied.',                   'status' => 'Done', 'due_date' => now()->subDays(2), 'assigned_user_id' => $member->id, 'lead_id' => null],
            ['title' => 'Update CRM pipeline after Q1 close',          'description' => 'Archived stale leads, updated statuses, cleaned duplicate records.',     'status' => 'Done', 'due_date' => now()->subDays(4), 'assigned_user_id' => $admin->id,  'lead_id' => null],
        ];

        foreach ($tasksData as $td) {
            $existing = Task::where('title', $td['title'])
                ->where('company_id', $company->id)
                ->first();
            if (!$existing) {
                Task::create(array_merge($td, ['company_id' => $company->id]));
            }
        }

        // ── Automations ───────────────────────────────────────────────
        $automationsData = [
            [
                'name'          => 'New Lead → Create Follow-up Task',
                'trigger_event' => 'lead_created',
                'trigger_value' => null,
                'action_type'   => 'create_task',
                'action_config' => ['title' => 'Follow up with new lead', 'description' => 'Auto-created task: reach out within 24 hours.', 'status' => 'Todo'],
                'is_active'     => true,
                'run_count'     => 13,
            ],
            [
                'name'          => 'Lead Qualified → Log Note',
                'trigger_event' => 'lead_status_changed',
                'trigger_value' => 'Qualified',
                'action_type'   => 'log_note',
                'action_config' => ['message' => 'Lead has been qualified. Sales team notified to prioritise.'],
                'is_active'     => true,
                'run_count'     => 5,
            ],
            [
                'name'          => 'New Client → Create Onboarding Task',
                'trigger_event' => 'client_created',
                'trigger_value' => null,
                'action_type'   => 'create_task',
                'action_config' => ['title' => 'Onboard new client', 'description' => 'Auto-created: complete client onboarding checklist within 7 days.', 'status' => 'Todo'],
                'is_active'     => true,
                'run_count'     => 3,
            ],
            [
                'name'          => 'Overdue Task → Move Lead to Follow-up',
                'trigger_event' => 'task_overdue',
                'trigger_value' => null,
                'action_type'   => 'update_lead_status',
                'action_config' => ['status' => 'Contacted'],
                'is_active'     => false,
                'run_count'     => 0,
            ],
        ];

        foreach ($automationsData as $ad) {
            $existing = Automation::where('name', $ad['name'])
                ->where('company_id', $company->id)
                ->first();
            if (!$existing) {
                Automation::create(array_merge($ad, ['company_id' => $company->id]));
            }
        }
    }

    private function leadByEmail(array $leads, string $email): ?int
    {
        foreach ($leads as $lead) {
            if ($lead->email === $email) return $lead->id;
        }
        return null;
    }

    private function clientByEmail(array $clients, string $email): ?int
    {
        foreach ($clients as $client) {
            if ($client && $client->email === $email) return $client->id;
        }
        return null;
    }
}
