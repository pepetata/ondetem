import { Row, Col } from "react-bootstrap";
import { Field } from "formik";
import FormInput from "../../components/FormInput";

export default function AdFormCalendarTab({ adFormFields }) {
  return (
    <Row>
      <Col md={6}>
        <div style={{ textAlign: "center" }}>
          Informe claramente o período e horários de seu serviço, negócio ou
          evento!
        </div>
        <Field name={adFormFields.startdate.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.startdate} />
          )}
        </Field>
        <Field name={adFormFields.finishdate.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.finishdate} />
          )}
        </Field>
        <Field name={adFormFields.timetext.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.timetext} />
          )}
        </Field>
      </Col>
    </Row>
  );
}
