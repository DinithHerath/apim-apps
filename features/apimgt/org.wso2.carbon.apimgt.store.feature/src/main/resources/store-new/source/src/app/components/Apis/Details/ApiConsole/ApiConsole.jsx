/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import AuthManager from 'AppData/AuthManager';
import Paper from '@material-ui/core/Paper';
import WarningIcon from '@material-ui/icons/Warning';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import Progress from '../../../Shared/Progress';
import Api from '../../../../data/api';
import SwaggerUI from './SwaggerUI';
import Application from '../../../../data/Application';

/**
 *
 *
 * @param {*} theme
 */
const styles = theme => ({
    inputAdornmentStart: {
        width: '100%',
    },
    inputText: {
        marginLeft: '40px',
        minWidth: '400px',
    },
    grid: {
        spacing: 20,
        marginTop: '30px',
        marginBottom: '30px',
        paddingLeft: theme.spacing.unit * 5,
        paddingRight: theme.spacing.unit * 2,
    },
    userNotificationPaper: {
        padding: '20px',
    },
    formControl: {
        display: 'flex',
        flexDirection: 'row',
        paddingRight: theme.spacing.unit * 2,
    },
    gridWrapper: {
        paddingTop: theme.spacing.unit * 2,
    },
});
/**
 *
 *
 * @class ApiConsole
 * @extends {React.Component}
 */
class ApiConsole extends React.Component {
    /**
     *Creates an instance of ApiConsole.
     * @param {*} props
     * @memberof ApiConsole
     */
    constructor(props) {
        super(props);
        this.state = { showToken: false };
        this.apiClient = new Api();
        this.handleChanges = this.handleChanges.bind(this);
        this.accessTokenProvider = this.accessTokenProvider.bind(this);
        this.handleClickShowToken = this.handleClickShowToken.bind(this);
        this.updateSwagger = this.updateSwagger.bind(this);
        this.updateAccessToken = this.updateAccessToken.bind(this);
        this.updateApplication = this.updateApplication.bind(this);
    }

    /**
     *
     *
     * @memberof ApiConsole
     */
    componentDidMount() {
        const { match } = this.props;
        const apiID = match.params.api_uuid;
        let api;
        let environments;
        let selectedEnvironment;
        let swagger;
        let subscriptions;
        let selectedApplication;
        let keys;
        let selectedKeyType;
        let accessToken;
        const promiseAPI = this.apiClient.getAPIById(apiID);

        promiseAPI
            .then((apiResponse) => {
                api = apiResponse.obj;
                environments = api.endpointURLs;

                if (environments && environments.length > 0) {
                    selectedEnvironment = environments[0].environmentName;
                    return this.apiClient.getSwaggerByAPIIdAndEnvironment(apiID, selectedEnvironment);
                } else {
                    return this.apiClient.getSwaggerByAPIId(apiID);
                }
            })
            .then((swaggerResponse) => {
                swagger = swaggerResponse.obj;
                return this.apiClient.getSubscriptions(apiID);
            })
            .then((subscriptionsResponse) => {
                subscriptions = subscriptionsResponse.obj.list;

                if (subscriptions && subscriptions.length > 0) {
                    selectedApplication = subscriptions[0].applicationId;
                    const promiseApp = Application.get(selectedApplication);

                    promiseApp
                        .then((application) => {
                            return application.getKeys();
                        })
                        .then((appKeys) => {
                            if (appKeys.get('PRODUCTION')) {
                                selectedKeyType = 'PRODUCTION';
                                ({ accessToken } = appKeys.get('PRODUCTION').token);
                            } else if (appKeys.get('SANDBOX')) {
                                selectedKeyType = 'SANDBOX';
                                ({ accessToken } = appKeys.get('PRODUCTION').token);
                            }

                            this.setState({
                                api,
                                swagger,
                                subscriptions,
                                environments,
                                selectedEnvironment,
                                selectedApplication,
                                keys: appKeys,
                                selectedKeyType,
                                accessToken,
                            });
                        });
                } else {
                    this.setState({
                        api,
                        swagger,
                        subscriptions,
                        environments,
                        selectedEnvironment,
                        selectedApplication,
                        keys,
                        selectedKeyType,
                        accessToken,
                    });
                }
            })
            .catch((error) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(error);
                }
                const { status } = error;
                if (status === 404) {
                    this.setState({ notFound: true });
                }
            });
    }

    /**
     *
     * Handle onClick of shown access token
     * @memberof ApiConsole
     */
    handleClickShowToken() {
        const { showToken } = this.state;
        this.setState({ showToken: !showToken });
    }

    /**
     *
     * Provids the access token to the Swagger UI
     * @returns access token
     * @memberof ApiConsole
     */
    accessTokenProvider() {
        const { accessToken } = this.state;
        return accessToken;
    }

    /**
     *
     * Handle onChange of inputs
     * @memberof ApiConsole
     */
    handleChanges(event) {
        const { target } = event;
        const { name, value } = target;
        switch (name) {
            case 'selectedEnvironment':
                this.setState({ [name]: value }, this.updateSwagger);
                break;
            case 'selectedApplication':
                this.setState({ [name]: value }, this.updateApplication);
                break;
            case 'selectedKeyType':
                this.setState({ [name]: value }, this.updateAccessToken);
                break;
            default:
                this.setState({ [name]: value });
        }
    }

    /**
     *
     * Load the swagger file of the selected environemnt
     * @memberof ApiConsole
     */
    updateSwagger() {
        const { selectedEnvironment, api } = this.state;
        let promisSwagger;

        if (selectedEnvironment) {
            promisSwagger = this.apiClient.getSwaggerByAPIIdAndEnvironment(api.id, selectedEnvironment);
        } else {
            promisSwagger = this.apiClient.getSwaggerByAPIId(api.id);
        }
        promisSwagger.then((swaggerResponse) => {
            this.setState({ swagger: swaggerResponse.obj });
        });
    }

    /**
     *
     * Load the access token for given key type
     * @memberof ApiConsole
     */
    updateAccessToken() {
        const { keys, selectedKeyType } = this.state;
        let accessToken;

        if (keys.get(selectedKeyType)) {
            ({ accessToken } = keys.get(selectedKeyType).token);
        }
        this.setState({ accessToken });
    }

    /**
     *
     * Load the selected application information
     * @memberof ApiConsole
     */
    updateApplication() {
        const { selectedApplication, selectedKeyType } = this.state;
        const promiseApp = Application.get(selectedApplication);
        let accessToken;

        promiseApp
            .then((application) => {
                return application.getKeys();
            })
            .then((appKeys) => {
                if (appKeys.get(selectedKeyType)) {
                    ({ accessToken } = appKeys.get(selectedKeyType).token);
                }
                this.setState({ accessToken, keys: appKeys });
            });
    }

    /**
     *
     *
     * @returns
     * @memberof ApiConsole
     */
    render() {
        const { classes } = this.props;
        const {
            api, notFound, swagger, accessToken, showToken, subscriptions, selectedApplication, selectedKeyType,
            selectedEnvironment, environments,
        } = this.state;
        const user = AuthManager.getUser();

        if (api == null || swagger == null) {
            return <Progress />;
        }
        if (notFound) {
            return 'API Not found !';
        }

        return (
            <React.Fragment>
                <Grid container className={classes.grid}>
                    {!user && (
                        <Grid item md={6}>
                            <Paper className={classes.userNotificationPaper}>
                                <Typography variant='h5' component='h3'>
                                    <WarningIcon />
                                    {' '}
                                    Notice
                                </Typography>
                                <Typography component='p'>
                                    You require an access token to try the API. Please log in and subscribe to the API
                                    to generate an access token. If you already have an access token, please provide it
                                    below.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                    {subscriptions && subscriptions.length > 0 && (
                        <Grid container>
                            <Grid item md={4} xs={4} className={classes.gridWrapper}>
                                <FormControl className={classes.formControl}>
                                    <InputLabel htmlFor='application-selection'>Applications</InputLabel>
                                    <Select
                                        name='selectedApplication'
                                        value={selectedApplication}
                                        onChange={this.handleChanges}
                                        input={<Input name='subscription' id='application-selection' />}
                                        fullWidth
                                    >
                                        {subscriptions.map(sub => (
                                            <MenuItem value={sub.applicationInfo.applicationId}>
                                                {sub.applicationInfo.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item md={4} xs={4} className={classes.gridWrapper}>
                                <FormControl className={classes.formControl}>
                                    <InputLabel htmlFor='key-type-selection'>Key</InputLabel>
                                    <Select
                                        name='selectedKeyType'
                                        value={selectedKeyType}
                                        onChange={this.handleChanges}
                                        input={<Input name='subscription' id='key-type-selection' />}
                                        fullWidth
                                    >
                                        <MenuItem value='PRODUCTION'>
                                            PRODUCTION
                                        </MenuItem>
                                        <MenuItem value='SANDBOX'>
                                            SANDBOX
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                    {environments && environments.length > 0 && (
                        <Grid item md={8} xs={8} className={classes.gridWrapper}>
                            <FormControl className={classes.formControl}>
                                <InputLabel htmlFor='environment-selection'>Environment</InputLabel>
                                <Select
                                    name='selectedEnvironment'
                                    value={selectedEnvironment}
                                    onChange={this.handleChanges}
                                    input={<Input name='environment' id='environment-selection' />}
                                    fullWidth
                                >
                                    {environments.map(env => (
                                        <MenuItem value={env.environmentName}>
                                            {env.environmentName}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value='a'>
                                            a
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid container md={9} xs={8} justify='center'>
                        <Grid item md={9} xs={8} className={classes.gridWrapper}>
                            <TextField
                                margin='normal'
                                variant='outlined'
                                className={classes.inputText}
                                label='Access Token'
                                name='accessToken'
                                onChange={this.handleChanges}
                                type={showToken ? 'text' : 'password'}
                                value={accessToken || ''}
                                helperText='Enter access token'
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton
                                                edge='end'
                                                aria-label='Toggle token visibility'
                                                onClick={this.handleClickShowToken}
                                            >
                                                {showToken ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    startAdornment: (
                                        <InputAdornment className={classes.inputAdornmentStart} position='start'>
                                            {api.authorizationHeader ? api.authorizationHeader : 'Authorization'}
                                            {' '}
                                            :Bearer
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <SwaggerUI accessTokenProvider={this.accessTokenProvider} spec={swagger} />
            </React.Fragment>
        );
    }
}

ApiConsole.defaultProps = {
    // handleInputs: false,
};

ApiConsole.propTypes = {
    // handleInputs: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(ApiConsole);
