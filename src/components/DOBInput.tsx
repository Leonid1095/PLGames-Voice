import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectSearch from "react-select-search";
import styled from "styled-components";
import { Input } from "./AuthComponents";
import "./DOBInput.css";

// const MIN_AGE = 13;
const MIN_AGE = 3; // we do this instead so we can show an age gate if they are under 13
const MAX_AGE = 120;

const Container = styled.div`
	display: flex;
`;

const CustomInput = styled(Input)`
	box-sizing: border-box;
	width: 100%;
`;

interface Props {
	onChange: (value: string) => void;
	onErrorChange: (errors: { month?: string; day?: string; year?: string }) => void;
	error: boolean;
	disabled?: boolean;
}

export function DOBInput(props: Props) {
	const { t } = useTranslation();

	const MONTHS = [
		{ value: "01", name: t('dob.january') },
		{ value: "02", name: t('dob.february') },
		{ value: "03", name: t('dob.march') },
		{ value: "04", name: t('dob.april') },
		{ value: "05", name: t('dob.may') },
		{ value: "06", name: t('dob.june') },
		{ value: "07", name: t('dob.july') },
		{ value: "08", name: t('dob.august') },
		{ value: "09", name: t('dob.september') },
		{ value: "10", name: t('dob.october') },
		{ value: "11", name: t('dob.november') },
		{ value: "12", name: t('dob.december') },
	];

	const [month, setMonth] = useState("");
	const [day, setDay] = useState("");
	const [year, setYear] = useState("");
	const [errors, setErrors] = useState<{ month?: string; day?: string; year?: string }>({
		month: undefined,
		day: undefined,
		year: undefined,
	});

	const isFirstRender = useRef(true);

	const constructDate = useCallback((values: { month: string; day: string; year: string }) => {
		const { month, day, year } = values;
		// pad day with 0 if needed
		const dayPadded = day?.length === 1 ? `0${day}` : day;
		return `${year}-${month}-${dayPadded}`;
	}, []);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		props.onErrorChange(errors);
		props.onChange(constructDate({ month, day, year }));
	}, [month, day, year, errors]);

	const onInputChange = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// clear error for field
		const clearedErrors = { ...errors, [type]: undefined };
		setErrors(clearedErrors);

		// ensure only numbers
		if (isNaN(Number(value))) {
			setErrors({ ...clearedErrors, [type]: t('dob.invalidDate') });
			return;
		}

		if (type === "day") {
			// day should be a number between 1-31 and not more than 2 digits
			if (value !== "" && (value.length > 2 || Number(value) > 31 || Number(value) < 1)) {
				setDay(value);
				setErrors({ ...clearedErrors, [type]: t('dob.invalidDate') });
				return;
			}

			setDay(value);
		}

		if (type === "year") {
			// year must be between now-min and now-max
			if (
				value.length === 4 &&
				(Number(value) > new Date().getFullYear() - MIN_AGE ||
					Number(value) < new Date().getFullYear() - MAX_AGE)
			) {
				setYear(value);
				setErrors({ ...clearedErrors, [type]: t('dob.invalidDate') });
				return;
			}

			setYear(value);
		}
	};

	return (
		<Container>
			<SelectSearch
				placeholder={t('dob.month')}
				search
				options={MONTHS}
				onChange={(e) => setMonth(e as string)}
				value={month}
				disabled={props.disabled}
				onBlur={() => {}}
				onFocus={() => {}}
			/>
			<CustomInput
				placeholder={t('dob.day')}
				onChange={onInputChange("day")}
				value={day}
				error={!!errors.day || props.error}
				maxLength={2}
				disabled={props.disabled}
			/>
			<CustomInput
				placeholder={t('dob.year')}
				onChange={onInputChange("year")}
				value={year}
				error={!!errors.year || props.error}
				maxLength={4}
				disabled={props.disabled}
			/>
		</Container>
	);
}

export default DOBInput;
