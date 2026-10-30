import { Check } from "lucide-react";
import "../styles/GetHelp.css";

// Names of the 6 steps shown at the top of every Get Help page
const steps = ["Location", "Vehicle", "Issue", "Mechanic", "Tracking", "Summary"];

// currentStep is a number from 1 to 6 sent by each page
function RequestStepper({ currentStep }) {
  return (
    <div className="stepper">
      {steps.map((label, index) => {
        const stepNumber = index + 1;

        // Decide the style of each step: done, active or waiting
        let className = "stepper-item";
        if (stepNumber < currentStep) className += " done";
        if (stepNumber === currentStep) className += " active";

        return (
          <div key={label} className={className}>
            <span className="stepper-circle">
              {/* Finished steps show a tick, others show the number */}
              {stepNumber < currentStep ? <Check size={14} /> : stepNumber}
            </span>
            <span className="stepper-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default RequestStepper;