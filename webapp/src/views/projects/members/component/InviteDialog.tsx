import { Formik, Field } from 'formik';
import {
  makeStyles,
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  TextField,
  ButtonGroup,
  Box,
  Typography,
} from '@material-ui/core';
import { container } from 'tsyringe';
import { useTranslate, T } from '@tolgee/react';
import copy from 'copy-to-clipboard';

import { useApiMutation } from 'tg.service/http/useQueryApi';
import { useProject } from 'tg.hooks/useProject';
import { PermissionsMenu } from 'tg.component/security/PermissionsMenu';
import { LanguagePermissionsMenu } from 'tg.component/security/LanguagePermissionsMenu';
import { components } from 'tg.service/apiSchema.generated';
import LoadingButton from 'tg.component/common/form/LoadingButton';
import { LINKS, PARAMS } from 'tg.constants/links';
import { parseErrorResponse } from 'tg.fixtures/errorFIxtures';
import { MessageService } from 'tg.service/MessageService';
import { useMemo } from 'react';
import { Validation } from 'tg.constants/GlobalValidationSchema';

const messaging = container.resolve(MessageService);

type computedPermissions = NonNullable<
  components['schemas']['ProjectModel']['computedPermissions']
>;

const useStyles = makeStyles((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    minHeight: 150,
  },
  permissions: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

type Props = {
  open: boolean;
  onClose: () => void;
};

export const InviteDialog: React.FC<Props> = ({ open, onClose }) => {
  const classes = useStyles();
  const t = useTranslate();
  const project = useProject();
  const invite = useApiMutation({
    url: '/v2/projects/{projectId}/invite',
    method: 'put',
    invalidatePrefix: '/v2/projects/{projectId}/invitations',
  });

  const yupSchema = useMemo(() => Validation.INVITE_DIALOG_PROJECT(t), [t]);

  return (
    <Dialog {...{ open, onClose }} fullWidth>
      <Formik
        initialValues={{
          permission: 'MANAGE' as computedPermissions,
          permissionLanguages: [],
          type: 'email' as 'email' | 'link',
          text: '',
        }}
        validationSchema={yupSchema}
        validateOnMount={true}
        onSubmit={(data) => {
          invite.mutate(
            {
              path: { projectId: project.id },
              content: {
                'application/json': {
                  type: data.permission,
                  languages:
                    data.permission === 'TRANSLATE'
                      ? data.permissionLanguages
                      : undefined,
                  email: data.type === 'email' ? data.text : undefined,
                  name: data.type === 'link' ? data.text : undefined,
                },
              },
            },
            {
              onSuccess(data) {
                if (!data.invitedUserEmail) {
                  copy(
                    LINKS.ACCEPT_INVITATION.buildWithOrigin({
                      [PARAMS.INVITATION_CODE]: data.code,
                    })
                  );
                  messaging.success(
                    <T keyName="invite_user_invitation_copy_success" />
                  );
                } else {
                  messaging.success(
                    <T keyName="invite_user_invitation_email_success" />
                  );
                }
                onClose();
              },
              onError(e) {
                parseErrorResponse(e).forEach((e) =>
                  messaging.error(<T>{e}</T>)
                );
              },
            }
          );
        }}
      >
        {({ values, handleSubmit, isValid, ...formik }) => {
          return (
            <form onSubmit={handleSubmit}>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between">
                  <span>{t('project_members_dialog_title')}</span>
                  <ButtonGroup>
                    <Button
                      size="small"
                      disableElevation
                      color={values.type === 'email' ? 'primary' : undefined}
                      onClick={() => formik.setFieldValue('type', 'email')}
                      data-cy="invitation-dialog-type-email-button"
                    >
                      Email
                    </Button>
                    <Button
                      size="small"
                      disableElevation
                      color={values.type === 'link' ? 'primary' : undefined}
                      onClick={() => formik.setFieldValue('type', 'link')}
                      data-cy="invitation-dialog-type-link-button"
                    >
                      Link
                    </Button>
                  </ButtonGroup>
                </Box>
              </DialogTitle>
              <DialogContent>
                <div className={classes.content}>
                  <div>
                    <Typography variant="caption">
                      {t('invite_user_permission_label')}
                    </Typography>
                    <div className={classes.permissions}>
                      <PermissionsMenu
                        selected={values.permission}
                        onSelect={(permission) =>
                          formik.setFieldValue('permission', permission)
                        }
                        buttonProps={{
                          size: 'small',
                        }}
                      />
                      {values.permission === 'TRANSLATE' && (
                        <LanguagePermissionsMenu
                          selected={values.permissionLanguages}
                          onSelect={(langs) =>
                            formik.setFieldValue('permissionLanguages', langs)
                          }
                        />
                      )}
                    </div>
                  </div>

                  <Field name="text">
                    {({ field, meta }) => (
                      <TextField
                        data-cy="invitation-dialog-input-field"
                        type={values.type === 'email' ? 'email' : 'text'}
                        label={
                          values.type === 'email'
                            ? t('project_members_dialog_email')
                            : t('project_members_dialog_name')
                        }
                        error={Boolean(meta.touched && meta.error)}
                        helperText={meta.touched && meta.error}
                        {...field}
                      />
                    )}
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!isValid}
                  data-cy="invitation-dialog-invite-button"
                  loading={invite.isLoading}
                >
                  {values.type === 'email'
                    ? t('project_members_dialog_invite_button')
                    : t('project_members_dialog_create_link_button')}
                </LoadingButton>
              </DialogActions>
            </form>
          );
        }}
      </Formik>
    </Dialog>
  );
};
