import React from "react";
import "./css/Payment-index.css";
import useAccountPayment, { METER_TYPES, PROVIDERS, PAYMENTS_ENABLED, LANDLORD_PAYMENT } from "./Logic/Payment.js";
import Popup from "../components/Popup.jsx";

// Used for landlords and, with config={PRIVATE_USER_PAYMENT}, for private users
export default function AccountPayment({ config = LANDLORD_PAYMENT }) {
  const {
    totals, meterType, provider, form, errors, submitting, result,
    chooseMeterType, chooseProvider, setField, submit, fillTotal, closeResult, goBack,
  } = useAccountPayment(config);

  const selectedType = METER_TYPES.find((t) => t.id === meterType);

  return (
    <div className="lpayment">
      <div className="wrap">
        {/* HEADLINE */}
        <div className="headline">
          <button className="back" onClick={goBack} aria-label="Go back">
            <img alt="" src="/Landlord/images/back.svg" />
          </button>
          <div>
            <p className="eyebrow">Billing</p>
            <h1>Pay your bill</h1>
          </div>
        </div>

        {!PAYMENTS_ENABLED && (
          <p className="banner" role="note">
            <b>Online payment is coming soon.</b> You can fill in the form, but no money will be taken yet.
          </p>
        )}

        {/* TOTAL */}
        <section className="total" aria-label="Amount owed">
          <div>
            <p className="label">{config.totalLabel}</p>
            <b className="amount">{totals.status === "loading" ? "..." : totals.cost}</b>
            {totals.kwh !== null && <p className="kwh">{totals.kwh} kWh {config.kwhNote}</p>}
            {totals.status === "error" && <p className="kwh">Could not load your total. You can still enter an amount.</p>}
          </div>
          <p className="note">
            <b>Note.</b> {config.note}
          </p>
        </section>

        {/* STEP 1: METER TYPE */}
        <section className="step" aria-labelledby="step-meter">
          <h2 id="step-meter"><span>1</span> Choose the meter type</h2>
          <div className="meter-types" role="radiogroup" aria-labelledby="step-meter">
            {METER_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={meterType === t.id}
                className={`meter-card ${meterType === t.id ? "selected" : ""}`}
                style={{ backgroundImage: `url(/Landlord/images/${t.image})` }}
                onClick={() => chooseMeterType(t.id)}
              >
                <span className="meter-top">
                  <b>{t.label}</b>
                  <img alt="" src="/Landlord/images/chip.png" />
                </span>
                <small>{t.note}</small>
                <i className="tick" aria-hidden="true">✓</i>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 2: PAYMENT DETAILS */}
        {selectedType && (
          <form className="step pay-form" onSubmit={submit} noValidate aria-labelledby="step-pay">
            <h2 id="step-pay"><span>2</span> Pay {selectedType.label.toLowerCase()} with mobile money</h2>

            <div className={`providers ${errors.provider ? "invalid" : ""}`} role="radiogroup" aria-label="Payment method">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={provider === p.id}
                  className={`provider ${provider === p.id ? "selected" : ""}`}
                  onClick={() => chooseProvider(p.id)}
                >
                  <img alt="" src={`/Landlord/images/${p.logo}`} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            {errors.provider && <p className="field-error">{errors.provider}</p>}

            <div className="fields">
              <div className={`field ${errors.phone ? "invalid" : ""}`}>
                <label htmlFor="pay-phone">Mobile number</label>
                <input id="pay-phone" inputMode="tel" autoComplete="tel" placeholder="0241234567" value={form.phone} onChange={setField("phone")} aria-invalid={!!errors.phone} />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
              <div className={`field ${errors.amount ? "invalid" : ""}`}>
                <label htmlFor="pay-amount">
                  Amount (Gh₵)
                  {totals.amount && form.amount !== totals.amount && Number(totals.amount) > 0 && (
                    <button type="button" className="use-total" onClick={fillTotal}>Use total</button>
                  )}
                </label>
                <input id="pay-amount" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={setField("amount")} aria-invalid={!!errors.amount} />
                {errors.amount && <p className="field-error">{errors.amount}</p>}
              </div>
              <div className={`field ${errors.meter ? "invalid" : ""}`}>
                <label htmlFor="pay-meter">Meter number</label>
                <input id="pay-meter" placeholder="131xxxxxxx" value={form.meter} onChange={setField("meter")} aria-invalid={!!errors.meter} />
                {errors.meter && <p className="field-error">{errors.meter}</p>}
              </div>
            </div>

            <div className="form-foot">
              <p className="hint">You will get a prompt on your phone to approve the payment.</p>
              <button type="submit" className="submit" disabled={submitting}>
                {submitting ? "Sending..." : `Pay${form.amount && Number(form.amount) > 0 ? ` Gh₵${Number(form.amount).toFixed(2)}` : ""}`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RESULT */}
      {result && (
        <Popup label={result.ok ? "Payment sent" : "Payment not made"} onClose={closeResult}>
          <h3>{result.ok ? "Payment sent" : PAYMENTS_ENABLED ? "Payment failed" : "Payment not available yet"}</h3>
          <p>
            {result.ok
              ? result.message
              : PAYMENTS_ENABLED
                ? result.message
                : "Online payment is still being set up. Nothing was charged."}
          </p>
          <dl className="pay-summary">
            <dt>Meter type</dt><dd>{result.details.meterType}</dd>
            <dt>Method</dt><dd>{result.details.provider}</dd>
            <dt>Mobile</dt><dd>{result.details.phone}</dd>
            <dt>Meter</dt><dd>{result.details.meter}</dd>
            <dt>Amount</dt><dd>Gh₵{result.details.amount}</dd>
          </dl>
          <div className="popup-choices single">
            <button className="cancel" onClick={closeResult}>OK</button>
          </div>
        </Popup>
      )}
    </div>
  );
}
