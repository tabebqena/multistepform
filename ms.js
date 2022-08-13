/*
To use this multi step form
- divide your form into steps, each one is a HTMLElement with `form-step` 
  class (You can customize this by `options.formStepClass`).
- Avoid creating "submit btn" inside the form.
- If you create submit button. give one of the valid alterSubmitBtn strategies. Valid values include [null, 'next', 'hide']
  Default is `next`, This means that, The submit button `onclick` & `onsubmit` events will work as `showNext()`
- Use the external API:
  let msf = toMultiStepForm(form);
  msf.showFirst();
  msf.showNext();
  msf.showPrev();
  msf.moveTo();
  
- Listen to events:
  options.onStepShown() // receives msf as first argument & step index as second argument.
  options.onStepHide() // receives msf as first argument & step index as second argument.

- Customize how your form steps are defined:
  By default, each form step should have `form-step` class, You can provide your 
  custom class by `options.formStepClass`

- Customize the element show & hide methods:
  options.hideFun() // recrives msf as first argument & the element to hide as second one.
  options.showFun() // receives msf as first argument & the element to show as second one.
  By default, We toggle the element.style.display attribute, 'none' || 'block'

- Customize the way to store & get the current step :
  options.getCurrentStep() // receives msf as first argument.
  options.storeCurrentStep() // receives msf as first argument and the current step index as second one.
  This functions are useful if you want to store step index somewhere like: session, query strings etc.

- Customize the form submit:
  - toggle submit form on the last step:
    options.submitOnEnd  // default is true which means that the msf will submit the form after the last step.
    options.submitFun()  // The function to be executed as the form submission function. It recieves the msf as first 
                         // argument & you can acccess the form element by `msf.form`.
                         // By default, We use `form.submit()`
                         // But you can change this if you need. For example:. show message before or submit by `ajax`.
  
- Provide extra form validators:
  - `options.extravalidators` : this object map form field id to a single function that should validate it.
                                the function will recieve the HTMLElement as single argument & should return `true`
                                if validation success or `false` if failed.
  */
function toMultiStepForm(form, options) {
  const DEFAULT = {
    formStepClass: "form-step",
    // 
    getCurrentStep: null,
    storeCurrentStep: null,
    onStepShown: null,
    onStepHide: null,
    hideFun: null,
    showFun: null,
    submitFun: null,
    alterSubmitBtn: 'next', // [ 'next', 'null'. null, 'hide']
    submitOnEnd: true,
    extraValidators: {}
  }


  function defaultHideFun(context, element) {
    element.style.display = 'none';
  }

  function defaultShowFun(context, element) {
    element.style.display = 'block';
  }

  function defaultGetCurrentStep(context) {
    return context.currentStep;
  }

  function defaultStoreCurrentStep(context, step) {
    context.currentStep = step;
  }


  function defaultSubmit(context) {
    context.form.submit();
    return false;
  }

  function call(fn, ...args) { // ... is ES6
    if (fn != undefined) {
      return fn(...args)
    }
  }

  function alterSubmitBtn(form, strategy, callback) {
    if (strategy === null || strategy === 'null') {
      return;
    }
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
    if (strategy == 'next') {
      if (submitBtn != undefined) {
        submitBtn.addEventListener("click", callback);
        submitBtn.addEventListener("submit", callback);
      }
    } else if (strategy == 'hide') {
      submitBtn.style.display = 'none';
    }
  }

  class MultiStepForm {
    constructor(form, options) {
      this.form = form;
      this.options = this.fixOptions(options);
      this.formSteps = this.form.getElementsByClassName(this.options.formStepClass);
      this.options.stepLength = this.formSteps.length;

      if (this.formSteps.length === 0) {
        throw Error("Your form has no step defined by class: " + this.options.formStepClass);
      }
      this.currentStep = 0;
      this.initial();
      this.showFirst();
    }

    fixOptions(options) {
      options = options || {}
      this.options = Object.assign(DEFAULT, options);
      this.options.getCurrentStep = this.options.getCurrentStep || defaultGetCurrentStep
      this.options.storeCurrentStep = this.options.storeCurrentStep || defaultStoreCurrentStep;
      this.options.submitFun = this.options.submitFun || defaultSubmit;
      this.options.showFun = this.options.showFun || defaultShowFun;
      this.options.hideFun = this.options.hideFun || defaultHideFun;
      return this.options;
    }


    initial() {
      let self = this;
      // Hide all
      for (var x = 0; x < this.formSteps.length; x++) {
        this.formSteps[x].style.display = "none";
      }

      alterSubmitBtn(this.form, this.options.alterSubmitBtn, (event) => {
        event.preventDefault();
        self.showNext();
      });
    }

    submit() {
      return this.options.submitFun(this);
    }

    reportValidity(ele) {
      // report validity of the current step & its children
      let rv = true;

      function callExtraValidator(_element) {
        if (_element == undefined || typeof _element.getAttribute == 'undefined') {
          return true;
        }
        let id = _element.getAttribute("id");
        if (id == undefined) {
          return true;
        }
        let validator = this.options.extraValidators.get(id);
        if (validator == undefined) {
          return true;
        }
        return validator(_element);
      }

      for (var i = 0; i < ele.childNodes.length; i++) {
        let child = ele.childNodes[i];
        rv = rv && this.reportValidity(child) && callExtraValidator(child);
      }
      if (ele.reportValidity != undefined) {
        rv = rv && ele.reportValidity() && callExtraValidator(ele);
      }
      return rv;
    }

    moveTo(targetStep) {
      // This function will figure out which form-step to display
      if (targetStep < 0) {
        return false;
      }
      let currentStep = this.getCurrentStep();
      // Exit the function if any field in the current form-step is invalid:
      // and wants to go next
      if (targetStep > currentStep && !this.reportValidity(this.formSteps[currentStep])) return false;
      // if you have reached the end of the form...
      if (targetStep >= this.options.stepLength && this.options.submitOnEnd) {
        return this.submit();
      }
      if (currentStep !== undefined && currentStep !== null) {
        this.options.hideFun(this, this.formSteps[currentStep]);
        call(this.options.onStepHide, this, currentStep);
      }
      // Show current 
      this.options.showFun(this, this.formSteps[targetStep]);
      call(this.options.onStepShown, this, targetStep);
      //... and run a function that will display the correct step indicator:

      this.options.storeCurrentStep(this, targetStep);
    }

    showNext() {
      let current = this.getCurrentStep();
      this.moveTo(current + 1)
    }

    showFirst() {
      this.moveTo(0);
    }

    showPrev() {
      let current = this.getCurrentStep();
      this.moveTo(current - 1);
    }

    getCurrentStep(context) {
      return this.options.getCurrentStep(context || this);
    }
  }

  return new MultiStepForm(form, options);
}




