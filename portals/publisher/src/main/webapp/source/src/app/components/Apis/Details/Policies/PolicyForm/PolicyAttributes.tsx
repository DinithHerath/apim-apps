/*
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { FC, useState, } from 'react';
import { styled } from '@mui/material/styles';
import { Button , MenuItem, Paper, Theme } from '@mui/material';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import PriorityHighOutlined from '@mui/icons-material/PriorityHighOutlined';
import { FormattedMessage, useIntl } from 'react-intl';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/lab/ToggleButton';
import ToggleButtonGroup from '@mui/lab/ToggleButtonGroup';
import SubjectOutlinedIcon from '@mui/icons-material/SubjectOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddCircle } from '@mui/icons-material';
import { PolicyAttribute } from './Types';
import { ACTIONS } from './PolicyCreateForm';
import { Editor } from '@monaco-editor/react';

const PREFIX = 'PolicyAttributes';

const classes = {
    attributeProperty: `${PREFIX}-attributeProperty`,
    formControlSelect: `${PREFIX}-formControlSelect`,
    selectRoot: `${PREFIX}-selectRoot`,
    buttonIcon: `${PREFIX}-buttonIcon`,
    requiredToggleButton: `${PREFIX}-requiredToggleButton`,
    toggleButton: `${PREFIX}-toggleButton`
};


const Root = styled('div')(({theme}: { theme: Theme }) => ({
    [`& .${classes.attributeProperty}`]: {
        marginLeft: theme.spacing(0.5),
        marginRight: theme.spacing(0.5),
    },

    [`& .${classes.formControlSelect}`]: {
        marginTop: theme.spacing(2),
    },

    [`& .${classes.selectRoot}`]: {
        padding: '11.5px 14px',
        width: 100,
    },

    [`& .${classes.buttonIcon}`]: {
        marginRight: theme.spacing(1),
    },

    [`& .${classes.requiredToggleButton}`]: {
        height: '37.28px',
        width: '37.28px',
        '&.Mui-selected, &.Mui-selected:hover': {
            color: 'white',
            backgroundColor: theme.palette.primary.main,
        }
    },

    [`& .${classes.toggleButton}`]: {
        height: '37.28px',
        width: '37.28px',
    }
}));

const EditorContainer = styled(Box)(({ theme }) => ({
    height: 300,
    '& .monaco-editor': {
        borderBottomLeftRadius: theme.shape.borderRadius,
        borderBottomRightRadius: theme.shape.borderRadius,
        overflow: 'hidden',
    },
}));

interface PolicyAttributesProps {
    policyAttributes: PolicyAttribute[];
    dispatch?: React.Dispatch<any>;
    isViewMode: boolean;
}

/**
 * Handles the addition of policy attributes for a given policy.
 * @param {JSON} props Input props from parent components.
 * @returns {TSX} Policy attributes UI.
 */
const PolicyAttributes: FC<PolicyAttributesProps> = ({
    policyAttributes, dispatch, isViewMode
}) => {

    const intl = useIntl();
    const [descriptionAnchorEl, setDescriptionAnchorEl] = useState<HTMLElement | null>(null);
    const [valuePropertiesAnchorEl, setValuePropertiesAnchorEl] = useState<HTMLElement | null>(null);
    const [openedDescriptionPopoverId, setOpenedDescriptionPopoverId] = useState<string | null>(null);
    const [openedValuesPopoverId, setOpenedValuesPopoverId] = useState<string | null>(null);

    const addNewPolicyAttribute = () => {
        if (dispatch) {
            dispatch({ type: ACTIONS.ADD_POLICY_ATTRIBUTE });
        }
    }

    const getAttributeFormError = (attribute: PolicyAttribute, fieldName: string) => {
        let error = '';
        switch(fieldName) {
            case 'name': {
                if (attribute.name === '') {
                    error = intl.formatMessage({
                        id: 'Apis.Details.Policies.PolicyForm.PolicyAttributes.name.required.error',
                        defaultMessage: 'Name is Empty',
                    });
                }
                return error;
            }
            case 'displayName': {
                if (attribute.displayName === '') {
                    error = intl.formatMessage({
                        id: 'Apis.Details.Policies.PolicyForm.PolicyAttributes.displayName.required.error',
                        defaultMessage: 'Display Name is Empty',
                    });
                }
                return error;
            }
            case 'validationRegex': {
                const regex = attribute.validationRegex;
                if (regex && regex !== '') {
                    try {
                        // eslint-disable-next-line no-new
                        new RegExp(regex);
                    } catch(e) {
                        error = intl.formatMessage({
                            id: 'Apis.Details.Policies.PolicyForm.PolicyAttributes.validationRegex.invalid',
                            defaultMessage: 'Provided regular expression is invalid',
                        })
                    }
                }
                return error;
            }
            case 'defaultValue': {
                const defaultVal = attribute.defaultValue;
                const regex = attribute.validationRegex;
                if (defaultVal && defaultVal !== '' && regex && regex !== '') {
                    try {
                        if (!new RegExp(regex).test(defaultVal)) {
                            error = intl.formatMessage({
                                id: 'Apis.Details.Policies.PolicyForm.PolicyAttributes.defaultValue.validation.error',
                                defaultMessage: 'Please enter a valid input',
                            });
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }
                return error;
            }
            default:
                return error;
        }
    }

    /**
     * Function to handle form inputs
     * @param {any} event Event
     * @param {string} id Policy Attribute ID
     */
    const handleAttributeChange = (event: any, id: string, type?: string) => {
        if (dispatch) {
            if (type?.toLowerCase() === 'json') {
                dispatch({
                    type: ACTIONS.UPDATE_POLICY_ATTRIBUTE,
                    id,
                    field: 'defaultValue',
                    value: event
                });
            } else {
                dispatch({
                    type: ACTIONS.UPDATE_POLICY_ATTRIBUTE,
                    id,
                    field: event.target.name,
                    value: event.target.value
                });
            }
        }
    }

    /**
     * Function to handle toggle of required attribute
     * @param {boolean} currentState Current state of the required attrbute before toggle
     * @param {string} id Policy Attribute ID
     */
    const handleToggle = (currentState: boolean, id: string) => {
        if (dispatch) {
            dispatch({
                type: ACTIONS.UPDATE_POLICY_ATTRIBUTE,
                id,
                field: 'required',
                value: !currentState,
            });
        }
    }

    /**
     * Function to handle allowed values attribute
     * @param {React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>} event Event
     * @param {string} id Policy Attribute ID
     */
    const handleAllowedValues = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, id: string) => {
        if (dispatch) {
            dispatch({
                type: ACTIONS.UPDATE_POLICY_ATTRIBUTE,
                id,
                field: event.target.name,
                value: event.target.value.split(/[,][\s]*/)
            });
        }
    }

    // Description toggle button related actions
    const handleDescriptionToggle = (event: React.MouseEvent<HTMLElement>, id: string) => {
        setOpenedDescriptionPopoverId(id);
        setDescriptionAnchorEl(event.currentTarget);
    }
    const handleDescriptionClose = () => {
        setOpenedDescriptionPopoverId(null);
        setDescriptionAnchorEl(null);
    };

    // Value properties toggle button related actions
    const handleValuePropertiesToggle = (event: React.MouseEvent<HTMLElement>, id: string) => {
        setOpenedValuesPopoverId(id);
        setValuePropertiesAnchorEl(event.currentTarget);
    }
    const handleValuePropertiesClose = () => {
        setOpenedValuesPopoverId(null);
        setValuePropertiesAnchorEl(null);
    };

    return (
        (<Root>
            <Box display='flex' flexDirection='row' mt={1} pt={3}>
                <Box width='40%'>
                    <Typography color='inherit' variant='subtitle2' component='div'>
                        <FormattedMessage
                            id='Apis.Details.Policies.PolicyForm.PolicyAttributes.title'
                            defaultMessage='Policy Attributes'
                        />
                    </Typography>
                    <Typography color='inherit' variant='caption' component='p'>
                        <FormattedMessage
                            id='Apis.Details.Policies.PolicyForm.PolicyAttributes.description'
                            defaultMessage='Define attributes of the policy.'
                        />
                    </Typography>
                </Box>
                <Box width='60%'>
                    {!isViewMode && (
                        <Box component='div'>
                            <Grid item xs={12}>
                                <Box flex='1'>
                                    <Button
                                        color='primary'
                                        variant='outlined'
                                        id='add-policy-attributes-btn'
                                        onClick={addNewPolicyAttribute}
                                    >
                                        <AddCircle className={classes.buttonIcon} />
                                        <FormattedMessage
                                            id='Apis.Details.Policies.PolicyForm.PolicyAttributes.add.policy.attribute'
                                            defaultMessage='Add Policy Attribute'
                                        />
                                    </Button>
                                </Box>
                            </Grid>    
                        </Box>
                    )}
                    {isViewMode && policyAttributes.length === 0 && (
                        <Box component='div'>
                            <Grid item xs={12}>
                                <Box flex='1'>
                                    <Typography color='inherit' variant='body1' component='div'>
                                        <FormattedMessage
                                            id='Apis.Details.Policies.PolicyForm.PolicyAttributes.no.attributes.found'
                                            defaultMessage='Looks like this policy does not have any attributes'
                                        />
                                    </Typography>
                                </Box>
                            </Grid>    
                        </Box>
                    )}
                </Box>
            </Box>
            <Box component='div' m={3}>
                <Grid container spacing={2}>
                    {policyAttributes.map((attribute: PolicyAttribute) => (
                        <Grid item xs={12} key={attribute.name}>
                            <Box component='div' mt={1} mb={1}>
                                <Box display='flex' flexDirection='row' justifyContent='center' mb={1}>
                                    <Grid item xs={12} md={12} lg={3} className={classes.attributeProperty}>
                                        <TextField
                                            autoFocus
                                            fullWidth
                                            required
                                            name='name'
                                            label={
                                                <FormattedMessage
                                                    id={
                                                        'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                        'form.name.label'
                                                    }
                                                    defaultMessage='Name'
                                                />                                     
                                            }
                                            error={getAttributeFormError(attribute, 'name') !== ''}
                                            margin='dense'
                                            value={attribute.name}
                                            data-testid='add-policy-attribute-name-btn'
                                            helperText={
                                                getAttributeFormError(
                                                    attribute,
                                                    'name',
                                                ) || (
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.name.helperText'
                                                        }
                                                        defaultMessage='Attribute Name'
                                                    />
                                                )
                                            }
                                            onChange={(e) => handleAttributeChange(e, attribute.id)}
                                            variant='outlined'
                                            inputProps={{
                                                readOnly: isViewMode,
                                                style: isViewMode ? {cursor: 'auto'} : {},
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={12} lg={3} className={classes.attributeProperty}>
                                        <TextField
                                            fullWidth
                                            required
                                            name='displayName'
                                            label={
                                                <FormattedMessage
                                                    id={
                                                        'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                        'form.displayName.label'
                                                    }
                                                    defaultMessage='Display Name'
                                                />                                        
                                            }
                                            error={getAttributeFormError(attribute, 'displayName') !== ''}
                                            margin='dense'
                                            value={attribute.displayName}
                                            data-testid='add-policy-attribute-display-name-btn'
                                            helperText={
                                                getAttributeFormError(
                                                    attribute,
                                                    'displayName',
                                                ) || (
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.displayName.helperText'
                                                        }
                                                        defaultMessage='Attribute Display Name'
                                                    />
                                                )
                                            }
                                            onChange={(e) => handleAttributeChange(e, attribute.id)}
                                            variant='outlined'
                                            inputProps={{
                                                readOnly: isViewMode,
                                                style: isViewMode ? {cursor: 'auto'} : {},
                                            }}
                                        />
                                    </Grid>
                                    <Box m={1} sx={{ pt: 1 }}>
                                        <ToggleButtonGroup>
                                            {/* Attribute required or not */}
                                            <Tooltip
                                                placement='top'
                                                title={
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.required.tooltip'
                                                        }
                                                        defaultMessage='Required'
                                                    />
                                                }
                                                arrow
                                            >
                                                <ToggleButton
                                                    name='required'
                                                    value='required'
                                                    id='attribute-require-btn'
                                                    selected={attribute.required}
                                                    className={classes.requiredToggleButton}
                                                    onChange={() => handleToggle(attribute.required, attribute.id)}
                                                    style={ isViewMode ? {cursor: 'auto'} : {}}
                                                >
                                                    <PriorityHighOutlined />
                                                </ToggleButton>
                                            </Tooltip>

                                            {/* Attribute description */}
                                            <Tooltip
                                                placement='top'
                                                title={
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.description.tooltip'
                                                        }
                                                        defaultMessage='Description'
                                                    />
                                                }
                                                arrow
                                            >
                                                <ToggleButton
                                                    value='description'
                                                    className={classes.toggleButton}
                                                    onChange={(e) => handleDescriptionToggle(e, attribute.id)}
                                                >
                                                    <SubjectOutlinedIcon />
                                                </ToggleButton>
                                            </Tooltip>
                                            <Popover
                                                id={attribute.id}
                                                open={openedDescriptionPopoverId === attribute.id}
                                                anchorEl={descriptionAnchorEl}
                                                onClose={handleDescriptionClose}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'left',
                                                }}
                                            >
                                                <Box m={2}>
                                                    <TextField
                                                        fullWidth
                                                        name='description'
                                                        multiline
                                                        maxRows={4}
                                                        rows={4}
                                                        label={
                                                            <FormattedMessage
                                                                id={
                                                                    'Apis.Details.Policies.PolicyForm.' +
                                                                    'PolicyAttributes.form.description.label'
                                                                }
                                                                defaultMessage='Description'
                                                            />                                        
                                                        }
                                                        error={getAttributeFormError(attribute, 'description') !== ''}
                                                        margin='dense'
                                                        value={attribute.description}
                                                        helperText={
                                                            getAttributeFormError(
                                                                attribute,
                                                                'description',
                                                            ) || (
                                                                <FormattedMessage
                                                                    id={
                                                                        'Apis.Details.Policies.PolicyForm.' +
                                                                        'PolicyAttributes.form.description.helperText'
                                                                    }
                                                                    defaultMessage={
                                                                        'Short description about ' +
                                                                        'the policy attribute'
                                                                    }
                                                                />
                                                            )
                                                        }
                                                        onChange={(e) => handleAttributeChange(e, attribute.id)}
                                                        variant='outlined'
                                                        inputProps={{
                                                            readOnly: isViewMode,
                                                            style: isViewMode ? {cursor: 'auto'} : {},
                                                        }}
                                                    />
                                                </Box>
                                            </Popover>

                                            {/* Attribute values */}
                                            <Tooltip
                                                placement='top'
                                                title={
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.value.properties.tooltip'
                                                        }
                                                        defaultMessage='Value Properties'
                                                    />
                                                }
                                                arrow
                                            >
                                                <ToggleButton
                                                    value='attribute-values'
                                                    className={classes.toggleButton}
                                                    onChange={(e) => handleValuePropertiesToggle(e, attribute.id)}
                                                >
                                                    <FormatListBulletedOutlinedIcon />
                                                </ToggleButton>
                                            </Tooltip>
                                            <Popover
                                                id={attribute.id}
                                                open={openedValuesPopoverId === attribute.id}
                                                anchorEl={valuePropertiesAnchorEl}
                                                onClose={handleValuePropertiesClose}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'left',
                                                }}
                                            >
                                                <Box m={2}>
                                                    <Box m={2}>
                                                        <Typography color='inherit' variant='subtitle2' component='div'>
                                                            <FormattedMessage
                                                                id={
                                                                    'Apis.Details.Policies.PolicyForm.' +
                                                                    'PolicyAttributes.form.value.properties.' +
                                                                    'popover.title'
                                                                }
                                                                defaultMessage='Value Properties'
                                                            />
                                                        </Typography>
                                                    </Box>
                                                    <Box width={280} m={2}>

                                                        {/* Type */}
                                                        <FormControl
                                                            variant='outlined'
                                                            className={classes.formControlSelect}
                                                        >
                                                            <InputLabel id='type-dropdown-label'>Type</InputLabel>
                                                            <Select
                                                                name='type'
                                                                value={attribute.type}
                                                                label={
                                                                    <FormattedMessage
                                                                        id={
                                                                            'Apis.Details.Policies.PolicyForm.' +
                                                                            'PolicyAttributes.form.type.label'
                                                                        }
                                                                        defaultMessage='Type'
                                                                    />
                                                                }
                                                                onChange={(e) => handleAttributeChange(e, attribute.id)}
                                                                classes={{ root: classes.selectRoot }}
                                                                inputProps={{
                                                                    readOnly: isViewMode,
                                                                    style: isViewMode ? {cursor: 'auto'} : {},
                                                                }}
                                                            >
                                                                <MenuItem value='String'>String</MenuItem>
                                                                <MenuItem value='Integer'>Integer</MenuItem>
                                                                <MenuItem value='Boolean'>Boolean</MenuItem>
                                                                <MenuItem value='Enum'>Enum</MenuItem>
                                                                <MenuItem value='JSON'>JSON</MenuItem>
                                                            </Select>
                                                            <FormHelperText>Attribute Type</FormHelperText>
                                                        </FormControl>

                                                        {/* Allowed Values */}
                                                        {attribute.type.toLowerCase() === 'enum' && (
                                                            <Box mt={1}>
                                                                <TextField
                                                                    fullWidth
                                                                    required
                                                                    name='allowedValues'
                                                                    label={
                                                                        <FormattedMessage
                                                                            id={
                                                                                'Apis.Details.Policies.PolicyForm.' +
                                                                                'PolicyAttributes.form.allowed.values' +
                                                                                '.label'
                                                                            }
                                                                            defaultMessage='Allowed Values'
                                                                        />
                                                                    }
                                                                    margin='dense'
                                                                    variant='outlined'
                                                                    value={attribute.allowedValues}
                                                                    helperText={
                                                                        <FormattedMessage
                                                                            id={
                                                                                'Apis.Details.Policies.PolicyForm.' +
                                                                                'PolicyAttributes.form.allowed.values' +
                                                                                '.helperText'
                                                                            }
                                                                            defaultMessage={
                                                                                'Comma separated list of ' +
                                                                                'allowed values for Enum attribute'
                                                                            }
                                                                        />
                                                                    }
                                                                    onChange={
                                                                        (e) => handleAllowedValues(e, attribute.id)
                                                                    }
                                                                    inputProps={{
                                                                        readOnly: isViewMode,
                                                                        style: isViewMode ? {cursor: 'auto'} : {},
                                                                    }}
                                                                />
                                                            </Box>
                                                        )}

                                                        {/* Validation Regex */}
                                                        <Box mt={1}>
                                                            <TextField
                                                                fullWidth
                                                                name='validationRegex'
                                                                label={
                                                                    <FormattedMessage
                                                                        id={
                                                                            'Apis.Details.Policies.PolicyForm.' +
                                                                            'PolicyAttributes.form.validation.regex.' +
                                                                            'label'
                                                                        }
                                                                        defaultMessage='Validation Regex'
                                                                    />                                        
                                                                }
                                                                error={
                                                                    getAttributeFormError(
                                                                        attribute,
                                                                        'validationRegex',
                                                                    ) !== ''
                                                                }
                                                                margin='dense'
                                                                value={attribute.validationRegex}
                                                                helperText={
                                                                    getAttributeFormError(
                                                                        attribute,
                                                                        'validationRegex',
                                                                    ) || (
                                                                        <FormattedMessage
                                                                            id={
                                                                                'Apis.Details.Policies.PolicyForm.' +
                                                                                'PolicyAttributes.form.validation.' +
                                                                                'regex.helperText'
                                                                            }
                                                                            defaultMessage={
                                                                                'Regex for attribute ' +
                                                                                'validation ( E.g.: ^([a-zA-Z]+)$ )'
                                                                            }
                                                                        />
                                                                    )
                                                                }
                                                                onChange={(e) => handleAttributeChange(e, attribute.id)}
                                                                variant='outlined'
                                                                inputProps={{
                                                                    readOnly: isViewMode,
                                                                    style: isViewMode ? {cursor: 'auto'} : {},
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Default Value */}
                                                        <Box mt={1}>
                                                            {attribute.type.toLowerCase() === 'json' ? (
                                                                <>
                                                                    <Paper variant='outlined'>
                                                                        <EditorContainer>
                                                                            <Editor
                                                                                height='100%'
                                                                                defaultLanguage='json'
                                                                                value={attribute.defaultValue}
                                                                                onChange={
                                                                                    (e) => handleAttributeChange(
                                                                                        e,
                                                                                        attribute.id,
                                                                                        attribute.type
                                                                                    )
                                                                                }
                                                                                theme='light'
                                                                                options={{
                                                                                    readOnly: isViewMode,
                                                                                    minimap: { enabled: false },
                                                                                    lineNumbers: 'on',
                                                                                    scrollBeyondLastLine: false,
                                                                                    tabSize: 2,
                                                                                    lineNumbersMinChars: 2,
                                                                                }}
                                                                            />
                                                                        </EditorContainer>
                                                                    </Paper>

                                                                    {/* Helper or Error text */}
                                                                    <FormHelperText sx={{ mx: '14px' }}>
                                                                        {getAttributeFormError(attribute, 'validationRegex') || (
                                                                            <FormattedMessage
                                                                                id={"Apis.Details.Policies.PolicyForm."
                                                                                    + "PolicyAttributes.form.default.value.helperText"}
                                                                                defaultMessage={"Default value for the attribute"
                                                                                    + " (if any)"}
                                                                            />)}
                                                                    </FormHelperText>
                                                                </>
                                                            ) : (
                                                                <TextField
                                                                    fullWidth
                                                                    name="defaultValue"
                                                                    label={
                                                                        <FormattedMessage
                                                                            id={"Apis.Details.Policies.PolicyForm."
                                                                                + "PolicyAttributes.form.default.value.label"}
                                                                            defaultMessage="Default Value"
                                                                        />
                                                                    }
                                                                    error={getAttributeFormError(attribute, 'defaultValue') !== ''}
                                                                    margin="dense"
                                                                    value={attribute.defaultValue}
                                                                    helperText={
                                                                        getAttributeFormError(attribute, 'defaultValue') || (
                                                                            <FormattedMessage
                                                                                id={"Apis.Details.Policies.PolicyForm."
                                                                                    + "PolicyAttributes.form.default.value.helperText"}
                                                                                defaultMessage={"Default value for the attribute"
                                                                                    + " (if any)"}
                                                                            />
                                                                        )
                                                                    }
                                                                    onChange={(e) => handleAttributeChange(e, attribute.id)}
                                                                    variant="outlined"
                                                                    inputProps={{
                                                                        readOnly: isViewMode,
                                                                        style: isViewMode ? { cursor: 'auto' } : {},
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Popover>

                                            {/* Attribute delete */}
                                            <Tooltip
                                                placement='top'
                                                title={
                                                    <FormattedMessage
                                                        id={
                                                            'Apis.Details.Policies.PolicyForm.PolicyAttributes.' +
                                                            'form.delete.tooltip'
                                                        }
                                                        defaultMessage='Delete'
                                                    />
                                                }
                                                arrow
                                            >
                                                <ToggleButton
                                                    value='delete'
                                                    className={classes.toggleButton}
                                                    onClick={() =>
                                                        dispatch && dispatch({
                                                            type: ACTIONS.DELETE_POLICY_ATTRIBUTE,
                                                            id: attribute.id,
                                                        })
                                                    }
                                                    style={ isViewMode ? {cursor: 'auto'} : {}}
                                                >
                                                    <DeleteIcon />
                                                </ToggleButton>
                                            </Tooltip>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Root>)
    );
}

export default React.memo(PolicyAttributes);
