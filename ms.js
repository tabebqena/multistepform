/*
To use this multi step form
- create html form element, You can set its id attribute if there is multiple forms in the page.
- divide your form into steps, each one is a HTMLElement with `form-step` class.
- Avoid creating "submit btn" >> better ..
- If you create submit button, the script will alter its onclick & onsubmit listeners.
- Optional:. create element to host the button , by class 'btn-bar', Or the script will create it for you.
- Optional:. create next-btn inside the btn-bar with class 'next-btn', or leave it.
- Optional:. create prev-btn inside the  btn-bar  with class 'prev-btn', or leave it.
- You can only create the button bar & the script will create the buttons for you.
- Optional:. create element to host the indicators,  by class 'step-bar'
- Optional:. You can create step-indicator elments inside the 'step-bar' or leave it blank, the script will create them for you.    
- You can only create the step-bar & the script will fill it for you.
- Attach your style for the following: 
*/
function createMultiStepForm(form, options) {
  const DEFAULT = {
    // stepBar options
    createStepBar: true,
    stepBarElement: null,
    stepBarParentElement: null,
    stepBarTag: "div",
    stepBarClasses: ["step-bar"],
    stepBarAttrs: {},
    stepIndicatorTag: "div",
    stepIndicatorClasses: ["step-indicator"],
    stepIndicatorExtraClasses: [],

    //
    createBtnBar: true,
    btnBarElement: null,
    btnBarAttrs: {},
    btnBarClasses: ["btn-bar"],
    // 
    getCurrentStep: getCurrentStep,
    storeCurrentStep: storeCurrentStep,
    onPrevClick: null,
    onNextClick: null,
    onFirstStep: onFirstStep,
    onLastStep: onLastStep,
    onStep: onStep,
    beforeSubmit: null
  }

  // 
  function getFirstElementByClassName(className, parent = document,) {
    let elements = parent.getElementsByClassName(className)
    if (elements != undefined) {
      return elements[0]
    }
  }  // Default callbacks
  function onFirstStep(form) {
    let prevBtn = getFirstElementByClassName("prev-btn", form);
    let nextBtn = getFirstElementByClassName("next-btn", form);
    if (prevBtn) {
      prevBtn.style.display = "none";
    }
    if (nextBtn) {
      nextBtn.style.display = "inline";
    }
  }

  function onLastStep(form) {
    let prevBtn = getFirstElementByClassName("prev-btn", form);
    let nextBtn = getFirstElementByClassName("next-btn", form)
    if (prevBtn) {
      prevBtn.style.display = "inline";
    }
    if (nextBtn) {
      nextBtn.innerHTML = "Submit";
    }
  }
  function onStep(form, n) {
    let prevBtn = getFirstElementByClassName("prev-btn", form);
    let nextBtn = getFirstElementByClassName("next-btn", form)
    if (prevBtn) {
      prevBtn.style.display = "inline";
    }
    if (nextBtn) {
      nextBtn.innerHTML = "Next";
    }
  }



  // helper functions //
  function getCurrentStep() {
    // let params = new URLSearchParams(document.URL.search);
    const url = new URL(window.document.URL);
    let formId = form.getAttribute("id");
    if (formId != undefined) {
      // try by form-id-step
      currentStep = url.searchParams.get(formId + "-step")
    }
    // try by step
    if (currentStep == undefined) {
      currentStep = url.searchParams.get("step")
    }
    // use default 0
    if (currentStep == undefined) {
      currentStep = 0;
    }
    // store it in the url
    return parseInt(currentStep);
  }



  function createElement(tag, attributes, classes) {
    let ele = document.createElement(tag);
    if (attributes != undefined) {
      for (key in attributes) {
        ele.setAttribute(key, attributes[key]);
      }
    }
    if (classes != undefined) {
      for (let index = 0; index < classes.length; index++) {
        ele.classList.add(classes[index]);
      }
    }
    return ele;
  }


  function storeCurrentStep(step) {
    let formId = form.getAttribute("id");
    // let params = new URLSearchParams(document.URL.search)

    const url = new URL(window.document.URL);
    console.log(url, url.searchParams.toString());

    if (formId != undefined) {
      url.searchParams.set(formId + "-step", step);
    } else {
      url.searchParams.set("step", step);
    }
    window.history.replaceState({}, "", url.toString());
  }

  function call(fn, ...args) { // ... is ES6
    if (fn != undefined) {
      return fn(...args)
    }
  }

  // //
  function fillStepBar(stepBarElement, tag, klasses, length) {
    for (let index = 0; index < length; index++) {
      stepBarElement.appendChild(createElement(tag, {}, klasses));
    }

  }


  function createStepBar(parent, tag, attrs, klasses, indicatorTag, indicatorKlasses, length) {
    let stepBarElement = parent.appendChild(createElement(tag, attrs || {}, klasses));
    // Add steps to stepBar
    // for (let index = 0; index < length; index++) {
    //   let s = stepBar.appendChild(createElement("div", {}, ["step-indicator"]));
    // }
    fillStepBar(stepBarElement, indicatorTag, indicatorKlasses, length);
    return stepBarElement;
  }


  function createBtn(parent, klass, text, onClick) {
    let btn = getFirstElementByClassName(klass, parent);
    if (btn == undefined) {
      btn = parent.appendChild(createElement("button", {}, [klass]));
      btn.innerText = text
    } else {
      throw Error("Can't create button, There is a `HTMLElement` with this class `" + klass + "` Set corresponding options to false or remove " + klass + "from this element.", btn);
    }
    btn.addEventListener("click", (event) => { onClick(event) });
  }

  function disableSubmitBtn(form, callback) {
    let inputElements = form.getElementsByTagName("input");
    let buttonElements = form.getElementsByTagName("button");
    let submitBtn = undefined
    for (let index = 0; index < inputElements.length; index++) {
      if (inputElements[index].getAttribute("type") == "submit") {
        submitBtn = inputElements[index];
        break;
      }
    }
    if (submitBtn == undefined) {
      for (let index = 0; index < buttonElements.length; index++) {
        if (buttonElements[index].getAttribute("type") == "submit") {
          submitBtn = buttonElements[index];
          break;
        }
      }
    }
    if (submitBtn != undefined) {
      submitBtn.addEventListener("click", callback);
      submitBtn.addEventListener("submit", callback);
    }
  }




  // 

  class MultiStepForm {
    constructor(form, options) {
      this.form = form;
      this.formSteps = this.form.getElementsByClassName("form-step");
      // Will be set in initial()
      this.stepLength = this.formSteps.length;
      options = options || {}
      this.options = Object.assign(DEFAULT, options);
      this.getCurrentStep = this.options.getCurrentStep || getCurrentStep
      this.storeCurrentStep = this.options.storeCurrentStep || storeCurrentStep;
      this.stepBarElement = this.options.stepBarElement;
      this.initial();
      call(this.options["on-form-ready"], form);
      this.showFirst();
    }

    initial() {
      let self = this;

      // Hide all
      for (var x = 0; x < this.formSteps.length; x++) {
        this.formSteps[x].style.display = "none";
      }
      // create stepBar
      if (this.options.createStepBar) {
        if (typeof (this.options.stepBarClasses == 'string')) {
          this.options.stepBarClasses = [this.options.stepBarClasses]
        }

        if (typeof (this.options.stepIndicatorClasses) == 'string') {
          this.options.stepIndicatorClasses = [this.stepIndicatorClasses]
        }

        if (this.options.stepBarElement) {
          // Try to fill the stepbar by stepIndicators
          if (this.options.stepBarElement.childNodes.length < this.stepLength) {
            fillStepBar(
              this.options.stepBarElement,
              this.options.stepIndicatorTag,
              this.options.stepIndicatorClasses,
              this.stepLength);
          }


        } else {
          // Check for duplicates, Don;t create new one if there is
          let _stepBar = getFirstElementByClassName(this.options.stepBarClasses[0], form);
          if (_stepBar != undefined) {
            throw Error("Malconfigured: `options.createStepBar` is true, `options.stepBarElement` is undefined & the form contains `HTMLElement` that has `step-bar` class. We can't create stepBar.", stepBar);
          }
          this.stepBarElement = createStepBar(
            this.options.stepBarParentElement || this.form,
            this.options.stepBarTag,
            this.options.stepBarAttrs,
            this.options.stepBarClasses,
            this.options.stepIndicatorTag,
            this.options.stepIndicatorClasses,
            this.stepLength,
          );
        }
      }

      // add buttonBar
      if (this.options.createBtnBar) {
        if (typeof (this.options.btnBarClasses) == 'string') {
          this.options.btnBarClasses = [this.options.btnBarClasses]
        }
        let btnBar = getFirstElementByClassName(this.options.btnBarClasses[0], form);
        if (btnBar != undefined) {
          throw Error("Can't create btnBar, There is a `HTMLElement` with class: " + this.options.btnBarClasses[0]);
        }
        btnBar = form.appendChild(createElement("div", {}, this.options.btnBarClasses));
        //
        createBtn(btnBar, "prev-btn", "Previous", (event) => {
          event.preventDefault();
          self.showPrev();
          call(this.options.onPrevClick);
        });
        createBtn(btnBar, "next-btn", "Next", (event) => {
          event.preventDefault();
          self.showNext();
          call(this.options.onNextClick);
        });
      }
      // 

      // if there is submit button, proxy it to next
      disableSubmitBtn(this.form, (event) => {
        console.log("submit clicked")
        event.preventDefault();
        self.showNext();
      });
    }

    moveTo(targetStep) {
      // This function will figure out which form-step to display
      // 
      if (targetStep < 0) {
        return false;
      }
      let currentStep = this.getCurrentStep();
      console.log("currentStep: ", currentStep);
      // Exit the function if any field in the current form-step is invalid:
      // and wants to go next
      if (targetStep > currentStep && !this.reportValidity(this.formSteps[currentStep])) return false;
      // if you have reached the end of the form...
      if (targetStep >= this.stepLength) {
        // ... the form gets submitted:
        if (this.options.beforeSubmit) {
          let rv = call(this.optionsbeforeSubmit, form);
          if (rv) {
            form.submit();
            return false;
          }
          return;
        }
        form.submit();
        return false;
      }
      // Otherwise, display the correct form-step:
      this.showStep(targetStep);
    }

    reportValidity(ele) {
      // report validity of the current step & its child
      let rv = true;
      for (var i = 0; i < ele.childNodes.length; i++) {
        rv = rv && this.reportValidity(ele.childNodes[i]);
      }
      console.log(ele, ele.reportValidity);
      if (ele.reportValidity != undefined) {
        rv = rv && ele.reportValidity();
      }
      return rv;
    }


    showStep(targetStep) {
      // This function will display the specified form-step of the form...
      // Hide others
      // Call callbacks
      console.log("show step", targetStep)
      for (let index = 0; index < this.formSteps.length; index++) {
        this.formSteps[index].style.display = "none";
      }
      this.formSteps[targetStep].style.display = "block";
      if (targetStep == 0) {
        call(this.options.onFirstStep, form);
      } else if (targetStep == (this.stepLength - 1)) {
        call(this.options.onLastStep, form);
      } else {
        call(this.options.onStep, form, targetStep);
      }
      //... and run a function that will display the correct step indicator:
      this.fixStepIndicator(targetStep);
      this.storeCurrentStep(targetStep);
    }

    fixStepIndicator(currentStep) {
      // This function removes the "active" class of all steps...

      var i, indicators = this.stepBarElement.getElementsByClassName("step-indicator");
      for (i = 0; i < indicators.length; i++) {
        indicators[i].classList.remove("active");
      }
      if (currentStep > 0) {
        if (indicators[currentStep - 1]) {
          indicators[currentStep - 1].classList.add("finish");
        }
        for (i = currentStep; i < indicators.length; i++) {
          indicators[i].classList.remove("finish");
        }
      }
      //... and adds the "active" class on the current step:
      if (indicators[currentStep]) {
        indicators[currentStep].classList.add("active");
      }
    }

    showNext(event) {
      if (event) {
        event.preventDefault();
      }
      let current = this.getCurrentStep();
      this.moveTo(current + 1)
    }

    showFirst(event) {
      if (event) {
        event.preventDefault();
      }
      this.moveTo(0);
    }

    showPrev(event) {
      if (event) {
        event.preventDefault();
      }
      let current = this.getCurrentStep();
      this.moveTo(current - 1);
    }
  }

  return new MultiStepForm(form, options);
}




