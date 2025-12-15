import { Component, computed, EventEmitter, inject, Input, Output, signal,input, effect } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DelayedErrorHandler } from '../../shared/utils/util.delayed.error.handler';
import { AppErrorStateMatcher } from '../../shared/utils/util.app.error.state.matcher';
import { MatCard } from '@angular/material/card';
import { MatCardModule } from '@angular/material/card';
import { CustomValidators } from '../../shared/utils/validators/utils.custom.validator';
import { RouterLink } from '@angular/router'; 
import { authFormOpenMode, IUser } from '../auth.model';

@Component({
  selector:    'em-auth-form',
  templateUrl: 'auth-form.component.html',
  styleUrls:   ['auth-form.component.css'],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCard,
    RouterLink
  ],
})
export class AuthFormComponent {

    mode = input<authFormOpenMode>('login');        // default mode = login 
    @Output() formSubmit = new EventEmitter<IUser>();
    
    fb: FormBuilder = inject(FormBuilder);

    authForm = this.fb.group({
            firstName:        this.fb.control('', []), // ['', [Validators.required, CustomValidators.hasWhiteSpace]],
            lastName:         this.fb.control('', []),//['', [Validators.required, CustomValidators.hasWhiteSpace]],
            email:            this.fb.control('', []), //['', [Validators.required, Validators.email ]],
            username:         this.fb.nonNullable.control('',[Validators.required]),
            password:         this.fb.nonNullable.control('', [Validators.required]), //['', [Validators.required]],
            confirmPassword:  this.fb.nonNullable.control('',[Validators.required])  //['', [Validators.required]],
    });

    constructor(){  
        
        // reactively adjust validators based on mode 
        effect(()=>{
            const m = this.mode();
            if(m === 'signup'){
                this.authForm.get('firstName')?.setValidators([Validators.required]);
                this.authForm.get('lastName')?.setValidators([Validators.required]);
                this.authForm.get('email')?.setValidators([Validators.required, Validators.email]);
                this.authForm.setValidators([CustomValidators.matchFields('password','confirmPassword')])
            } else {
                this.authForm.get('firstName')?.clearValidators();
                this.authForm.get('lastName')?.clearValidators();
                this.authForm.get('email')?.clearValidators();
                this.authForm.get('confirmPassword')?.clearValidators();
                this.authForm.clearValidators();
            }

            this.authForm.get('firstName')?.updateValueAndValidity({ emitEvent: false});
            this.authForm.get('lastName')?.updateValueAndValidity({emitEvent: false});
            this.authForm.get('email')?.updateValueAndValidity({emitEvent: false});
            this.authForm.updateValueAndValidity({emitEvent: false});
        })
    }
   
    handler = new DelayedErrorHandler(this.authForm);

    emailErrorMatcher = new AppErrorStateMatcher({
        showErrorsSignal: this.handler.getErrorSignal('email'),});

    firstNameErrorMatcher = new AppErrorStateMatcher({
        showErrorsSignal: this.handler.getErrorSignal('firstName'),});

    lastNameErrorMatcher = new AppErrorStateMatcher({
        showErrorsSignal: this.handler.getErrorSignal('lastName'),});

    passwordErrorMatcher = new AppErrorStateMatcher({
        showErrorsSignal: this.handler.getErrorSignal('password'),});

    passwordMismatchErrorMatcher = new AppErrorStateMatcher({
        showErrorsSignal: this.handler.getErrorSignal('confirmPassword'),});

    onSubmit(): void {
        if( this.authForm.invalid ) return;
        const {firstName, lastName, username, password,email} = this.authForm.getRawValue();
        const user: IUser = {username: username, password: password, firstName: firstName ?? '', lastName: lastName?? '', email: email?? ''};
        this.formSubmit.emit( user )
    }

}