import { useState } from "react";

// Field values plus inline errors. errors.form holds messages not tied to a single field.
export const useForm = (initialValues) => {
	const [values, setValues] = useState(initialValues);
	const [errors, setErrors] = useState({});

	// Props for <FormInput>; editing a field clears its error
	const bind = (field) => ({
		value: values[field],
		error: errors[field],
		onChange: (e) => {
			setValues((prev) => ({ ...prev, [field]: e.target.value }));
			setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
		},
	});

	// rules: { field: errorMessage | false }. Returns true when every rule passes.
	const validate = (rules) => {
		const found = Object.fromEntries(Object.entries(rules).filter(([, message]) => message));
		setErrors(found);
		return Object.keys(found).length === 0;
	};

	// Server sends { message, field? }; without a field the message shows at form level
	const setServerError = (err) => {
		const { field = "form", message = "Something went wrong" } = err.response?.data ?? {};
		setErrors({ [field]: message });
	};

	// <form onSubmit={handleSubmit(getRules, onValid)}>: runs onValid only if every rule passes
	const handleSubmit = (getRules, onValid) => (e) => {
		e.preventDefault();
		if (validate(getRules(values))) onValid();
	};

	const reset = () => {
		setValues(initialValues);
		setErrors({});
	};

	return { values, errors, bind, handleSubmit, setServerError, reset };
};

export const isEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

// Rules for a new password + confirmation; field is the new-password input's name
export const newPasswordRules = (password, confirmPassword, field = "password") => ({
	[field]: password.length < 6 && "Password must be at least 6 characters",
	confirmPassword: password !== confirmPassword && "Passwords do not match",
});
