import { Signal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormGroup, FormControl, AbstractControl } from "@angular/forms";
import { debounceTime, tap } from "rxjs";

/**
 * Generic  delayed error handler that works with both FormCOntrol and FormGroup
 */
export class DelayedErrorHandler {

    private showErrorMap = new Map<string, ReturnType<typeof signal<boolean>>>();
    private hasBlurredMap = new Map<string, ReturnType<typeof signal<boolean>>>();

    constructor( private control: FormGroup | FormControl, private delay = 800){
        if( control instanceof FormControl ){
            // single form control case
            this.intitControl( control, 'control');
            
        }else if( control instanceof FormGroup){
            // FormGroup case 
            Object.keys( control.controls).forEach(
                (key) => this.intitControl(control.controls[key], key)
            );
        }
    }
    intitControl(control: AbstractControl, key: string) {
        const showError = signal( false );
        const hasBlurred = signal( false );

        this.showErrorMap.set(key, showError);
        this.hasBlurredMap.set(key, hasBlurred);

        // watch for typing changes 
        toSignal( control.valueChanges.pipe(
            // as soon as user start typing, hide errors
            tap( () => {
                showError.set( false);
                hasBlurred.set(false);
            }),
            debounceTime( this.delay), // wait after typing stops
            tap( () => {
                // re-evaluate errors as soon as waiting time expired
                if( control.invalid && control.dirty ){
                    showError.set( true );
                }
            })
        ),
    {initialValue: ''})
    }

    /** Triger blur for specific control */
    onBlur( controlName?: string): void{
        if( this.control  instanceof FormControl){
            this.handleBlur( this.control, 'control');
            return;
        }

        if(  controlName && this.control instanceof FormGroup){
            const ctrl = this.control.get( controlName );
            if( ctrl ){
                this.handleBlur( ctrl, controlName );
            }
        }
    }

    handleBlur(control: AbstractControl, key: string) {
        const showError = this.showErrorMap.get( key);
        const hasBlurred = this.hasBlurredMap.get(key);

        hasBlurred?.set( true );
        control.markAllAsTouched();

        if( control.invalid ){
            showError?.set(true);
        }
    }

    /** Wether to show errors for specific control */
    showErrors(controlName?: string): boolean {
        if( this.control instanceof FormControl ){
            return this.showErrorMap.get('control')?.() ?? false;
        }

        if( this.control instanceof FormGroup && controlName){
            return this.showErrorMap.get( controlName )?.() ?? false;
        }
        
        return false;
    }

    /** Access control directly */
    get(controlName?: string): AbstractControl | null {
        if( this.control instanceof FormControl ) return this.control;
        if( this.control instanceof FormGroup && controlName ) return this.control.get(controlName);
        return null;
    }

    getErrorSignal(controlName?: string) : Signal<boolean> | undefined {
        if( this.control instanceof FormControl ) return this.showErrorMap.get('control') ?? undefined;
        if( this.control instanceof FormGroup && controlName ) return this.showErrorMap.get(controlName)?? undefined;
        return undefined;
    }

}