# multistepform
Javascript library to convert form to mult-step form


To use this multi step form
===========================

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
  msf.submit();
  
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
  toggle submit form on the last step:
    options.submitOnEnd  // default is true which means that the msf will submit the form after the last step.
    options.submitFun()  // The function to be executed as the form submission function. It recieves the msf as first 
                         // argument & you can acccess the form element by `msf.form`.
                         // By default, We use `form.submit()`
                         // But you can change this if you need. For example:. show message before or submit by `ajax`.
    N.B:. on your `options.submitFun`, Don't call 'msf.submit()' as this will raise recursive Error.
  
- Provide extra form validators:
  `options.extravalidators` : this object map form field id to a single function that should validate it.
                                the function will recieve the HTMLElement as single argument & should return `true`
                                if validation success or `false` if failed.
  
  
  Hosted by JSDelvier
  -------------------
     
     https://cdn.jsdelivr.net/gh/tabebqena/multistepform@main/ms.js
  