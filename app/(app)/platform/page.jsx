"use client";
import Link from "next/link";
import { useStore, money, dateStr, DAY } from "@/lib/store";
import { PageHead } from "@/components/ui";
import { Banner } from "@/components/Art";

const MONTHS_TO_SHOW = 6;

export default function Platform() {
  const { db, platformLoading, platformError } = useStore();
  if (!db) return null;
  if (platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Platform overview" sub="Live branch and license data from MongoDB." /><div className="callout warn" role="alert">{platformError}</div></>;

  const now = Date.now();
  const tenants = Array.isArray(db.tenants) ? db.tenants : [];
  const payments = Array.isArray(db.payments) ? db.payments : [];
  const plans = db.plans || {};
  const audit = Array.isArray(db.platformAudit) ? db.platformAudit : [];
  const active = tenants.filter((tenant) => tenant.on && tenant.status === "Active");
  const trial = tenants.filter((tenant) => tenant.status === "Trial");
  const suspended = tenants.filter((tenant) => !tenant.on || tenant.status === "Suspended");
  const monthlyRevenue = active.reduce((sum, tenant) => sum + (Number(plans[tenant.plan]?.price) || 0), 0);
  const last30Days = payments
    .filter((payment) => Number(payment.t) <= now && Number(payment.t) >= now - 30 * DAY)
    .reduce((sum, payment) => sum + (Number(payment.amt) || 0), 0);
  const tenantNames = new Map(tenants.map((tenant) => [String(tenant.id), tenant.name]));
  const recentPayments = [...payments]
    .sort((a, b) => Number(b.t) - Number(a.t))
    .slice(0, 5);
  const renewalWatch = tenants
    .filter((tenant) => tenant.on && Number.isFinite(Number(tenant.renewsAt)) && Number(tenant.renewsAt) <= now + 30 * DAY)
    .sort((a, b) => Number(a.renewsAt) - Number(b.renewsAt))
    .slice(0, 5);
  const planUsage = Object.entries(plans)
    .map(([name, plan]) => ({ name, count: tenants.filter((tenant) => tenant.plan === name).length, price: Number(plan.price) || 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const maxPlanUsage = Math.max(1, ...planUsage.map((plan) => plan.count));
  const recentAudit = audit.slice(0, 5);
  const monthlyPayments = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    monthStart.setMonth(monthStart.getMonth() - (MONTHS_TO_SHOW - index - 1));
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const total = payments
      .filter((payment) => Number(payment.t) >= monthStart.getTime() && Number(payment.t) < nextMonth.getTime())
      .reduce((sum, payment) => sum + (Number(payment.amt) || 0), 0);
    return {
      label: monthStart.toLocaleDateString("en-PK", { month: "short" }),
      total,
    };
  });
  const maxMonthlyPayment = Math.max(1, ...monthlyPayments.map((month) => month.total));

  return (
    <>
      <Banner title="Platform control room" sub="Live branch, plan and license revenue overview." stats={[
        ["Monthly recurring", money(monthlyRevenue)],
        ["Active branches", active.length],
        ["Collected (30 days)", money(last30Days)],
      ]} />
      <PageHead title="Platform overview" sub="Live metrics and activity from your MongoDB platform data." />
      <div className="kpis">
        <div className="kpi"><span>Monthly recurring</span><b>{money(monthlyRevenue)}</b><small>Across {active.length} active branches</small></div>
        <div className="kpi"><span>Collected (30 days)</span><b>{money(last30Days)}</b><small>{payments.length} total license payments</small></div>
        <div className="kpi"><span>Trial branches</span><b>{trial.length}</b><small>Out of {tenants.length} total branches</small></div>
        <div className="kpi"><span>Suspended branches</span><b>{suspended.length}</b><small>Access currently disabled</small></div>
      </div>

      <div className="platform-dashboard-grid">
        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>License payments</h3><p className="muted">Collected by month</p></div><Link className="btn sm" href="/subscriptions">View payments</Link></div>
          <div className="platform-chart" aria-label="Monthly license payments for the last six months">
            {monthlyPayments.map((month) => {
              const height = month.total ? Math.max(6, (month.total / maxMonthlyPayment) * 100) : 0;
              return <div className="platform-chart-column" key={month.label}>
                <span className="platform-chart-value">{money(month.total)}</span>
                <div className="platform-chart-track"><i style={{ height: `${height}%` }} title={`${month.label}: ${money(month.total)}`} /></div>
                <span className="platform-chart-label">{month.label}</span>
              </div>;
            })}
          </div>
        </section>

        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>Branches by plan</h3><p className="muted">{tenants.length} branches across {planUsage.length} plans</p></div><Link className="btn sm" href="/plans">Manage plans</Link></div>
          {planUsage.length === 0 ? <p className="platform-empty">No plans have been added.</p> : <div className="platform-plan-list">
            {planUsage.map((plan) => <div className="platform-plan-row" key={plan.name}>
              <div className="platform-plan-copy"><b>{plan.name}</b><span>{plan.count} {plan.count === 1 ? "branch" : "branches"} · {money(plan.price)}/month</span></div>
              <div className="platform-plan-meter" aria-label={`${plan.count} branches on ${plan.name}`}><i style={{ width: `${(plan.count / maxPlanUsage) * 100}%` }} /></div>
            </div>)}
          </div>}
        </section>

        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>Renewal watch</h3><p className="muted">Enabled branches renewing within 30 days</p></div><Link className="btn sm" href="/tenants">View branches</Link></div>
          {renewalWatch.length === 0 ? <p className="platform-empty">No enabled branches are due within 30 days.</p> : <div className="platform-list">
            {renewalWatch.map((tenant) => {
              const days = Math.ceil((Number(tenant.renewsAt) - now) / DAY);
              const badge = days < 0 ? "low" : days <= 5 ? "paused" : "live";
              const label = days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? "Due today" : `${days}d left`;
              return <div className="line" key={tenant.id}>
                <span><b>{tenant.name}</b><br /><small className="muted">{tenant.plan} · {dateStr(Number(tenant.renewsAt))}</small></span>
                <span className={`badge ${badge}`}>{label}</span>
              </div>;
            })}
          </div>}
        </section>

        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>Recent payments</h3><p className="muted">Latest recorded license payments</p></div><Link className="btn sm" href="/subscriptions">All payments</Link></div>
          {recentPayments.length === 0 ? <p className="platform-empty">No payments have been recorded.</p> : <div className="platform-list">
            {recentPayments.map((payment) => <div className="line" key={payment.id}>
              <span><b>{tenantNames.get(String(payment.tenantId)) || "Unknown branch"}</b><br /><small className="muted">{dateStr(Number(payment.t))} · {payment.method}</small></span>
              <b className="platform-payment-amount">{money(Number(payment.amt) || 0)}</b>
            </div>)}
          </div>}
        </section>

        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>Recent platform activity</h3><p className="muted">Latest administrative changes</p></div><Link className="btn sm" href="/platform-audit">Audit log</Link></div>
          {recentAudit.length === 0 ? <p className="platform-empty">No platform activity has been recorded.</p> : <div className="platform-list">
            {recentAudit.map(([action, user, details, timestamp], index) => <div className="platform-audit-item" key={`${timestamp}-${index}`}>
              <span className="platform-audit-dot" aria-hidden="true" />
              <div><b>{action}</b><p>{details}</p><small className="muted">{user} · {dateStr(Number(timestamp))}</small></div>
            </div>)}
          </div>}
        </section>

        <section className="panel pad platform-dashboard-panel">
          <div className="platform-dashboard-heading"><div><h3>Quick actions</h3><p className="muted">Manage the platform</p></div></div>
          <div className="platform-quick-actions">
            <Link className="btn" href="/tenants">Open branches</Link>
            <Link className="btn" href="/subscriptions">Record or review payments</Link>
            <Link className="btn" href="/plans">Create or update plans</Link>
            <Link className="btn" href="/resources">Manage app links and demos</Link>
          </div>
        </section>
      </div>
    </>
  );
}
