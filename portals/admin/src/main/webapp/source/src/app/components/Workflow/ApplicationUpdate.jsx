/*
 * Copyright (c) 2025, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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

import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import MUIDataTable from 'mui-datatables';
import ContentBase from 'AppComponents/AdminPages/Addons/ContentBase';
import InlineProgress from 'AppComponents/AdminPages/Addons/InlineProgress';
import Alert from 'AppComponents/Shared/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HelpBase from 'AppComponents/AdminPages/Addons/HelpBase';
import DescriptionIcon from '@mui/icons-material/Description';
import Link from '@mui/material/Link';
import Configurations from 'Config';
import API from 'AppData/api';
import Button from '@mui/material/Button';
import * as dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import WarningBase from 'AppComponents/AdminPages/Addons/WarningBase';
import {
    Alert as MUIAlert, Table, TableBody, TableRow, TableCell, TableContainer, TableHead,
} from '@mui/material';

/**
 * Render a list
 * @param {JSON} props props passed from parent
 * @returns {JSX} Header AppBar components.
 */
function ListLabels() {
    const intl = useIntl();
    const [data, setData] = useState(null);
    const restApi = new API();

    const [searchText, setSearchText] = useState('');
    const [isUpdating, setIsUpdating] = useState(null);
    const [buttonValue, setButtonValue] = useState();
    const [hasListPermission, setHasListPermission] = useState(true);
    const [errorMessage, setError] = useState(null);

    /**
     * API call to get Detected Data
     * @returns {Promise}.
     */
    function apiCall() {
        return restApi
            .workflowsGet('AM_APPLICATION_UPDATE')
            .then((result) => {
                const workflowlist = result.body.list.map((obj) => {
                    let changes = [];
                    try {
                        const applicationUpdateDiff = obj?.properties?.applicationUpdateDiff ?? [];
                        changes = JSON.parse(applicationUpdateDiff);
                    } catch (e) {
                        console.error('Could not parse changes:', e.message);
                    }

                    return {
                        changes,
                        description: obj.description,
                        applicationName: obj.properties.applicationName,
                        applicationTier: obj.properties.applicationTier,
                        userName: obj.properties.userName,
                        referenceId: obj.referenceId,
                        createdTime: obj.createdTime,
                        properties: obj.properties,
                    };
                });
                return workflowlist;
            })
            .catch((error) => {
                const { status } = error;
                if (status === 401) {
                    setHasListPermission(false);
                } else {
                    Alert.error(intl.formatMessage({
                        id: 'Workflow.ApplicationUpdate.apicall.has.errors',
                        defaultMessage: 'Unable to get workflow pending requests for Application Update',
                    }));
                    throw (error);
                }
            });
    }

    const fetchData = () => {
        // Fetch data from backend
        setData(null);
        const promiseAPICall = apiCall();
        promiseAPICall.then((LocalData) => {
            setData(LocalData);
        })
            .catch((e) => {
                console.error('Unable to fetch data. ', e.message);
                setError(e.message);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = (referenceId, value) => {
        setButtonValue(value);
        const body = { status: value, attributes: {}, description: '' };
        setIsUpdating(true);
        if (value === 'APPROVED') {
            body.description = 'Approve workflow request.';
        }
        if (value === 'REJECTED') {
            body.description = 'Reject workflow request.';
        }

        const promisedupdateWorkflow = restApi.updateWorkflow(referenceId, body);
        return promisedupdateWorkflow
            .then(() => {
                setIsUpdating(false);
                Alert.success(intl.formatMessage({
                    id: 'Workflow.ApplicationUpdate.update.success',
                    defaultMessage: 'Workflow status is updated successfully',
                }));
            })
            .catch((error) => {
                const { response, status } = error;
                const { body: { description } } = response;
                if (status === 401) {
                    Alert.error(description);
                } else if (response.body) {
                    Alert.error(intl.formatMessage({
                        id: 'Workflow.ApplicationUpdate.updateStatus.has.errors',
                        defaultMessage: 'Unable to complete application update approve/reject process. ',
                    }));
                    throw (response.body.description);
                }
                setIsUpdating(false);
                return null;
            })
            .then(() => {
                fetchData();
            });
    };

    const pageProps = {
        help: (
            <HelpBase>
                <List component='nav' aria-label='main mailbox folders'>
                    <ListItem button>
                        <ListItemIcon>
                            <DescriptionIcon />
                        </ListItemIcon>
                        <Link
                            target='_blank'
                            href={Configurations.app.docUrl
                                + 'consume/manage-application/advanced-topics/'
                                + 'adding-an-application-creation-workflow/#adding-an-application-creation-workflow'}
                            underline='hover'
                        >
                            <ListItemText primary={(
                                <FormattedMessage
                                    id='Workflow.ApplicationCreation.help.link.one'
                                    defaultMessage='Create a Application Creation approval workflow Request'
                                />
                            )}
                            />
                        </Link>
                    </ListItem>
                </List>
            </HelpBase>),

        pageStyle: 'half',
        title: intl.formatMessage({
            id: 'Workflow.ApplicationUpdate.title.applicationupdate',
            defaultMessage: 'Application Update - Approval Tasks',
        }),
    };

    const columProps = [
        {
            name: 'description',
            label: intl.formatMessage({
                id: 'Workflow.ApplicationUpdate.table.header.description',
                defaultMessage: 'Description',
            }),
            options: {
                sort: false,
                display: false,
            },
        },
        {
            name: 'applicationName',
            label: intl.formatMessage({
                id: 'Workflow.ApplicationUpdate.table.header.applicationName',
                defaultMessage: 'Application',
            }),
            options: {
                sort: false,
                filter: true,
                setCellProps: () => ({
                    style: {
                        maxWidth: '250px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    },
                }),
            },
        },
        {
            name: 'applicationTier',
            label: intl.formatMessage({
                id: 'Workflow.ApplicationUpdate.table.header.ApplicationTier',
                defaultMessage: 'Throttling Policy',
            }),
            options: {
                sort: false,
                filter: true,
            },
        },
        {
            name: 'userName',
            label: intl.formatMessage({
                id: 'Workflow.ApplicationUpdate.table.header.userName',
                defaultMessage: 'Updated by',
            }),
            options: {
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const dataRow = data[tableMeta.rowIndex];
                    const { properties } = dataRow;
                    const { createdTime } = dataRow;
                    dayjs.extend(relativeTime);
                    const time = dayjs(createdTime).fromNow();
                    dayjs.extend(localizedFormat);
                    const format = dayjs(createdTime).format('LLL');
                    return (
                        <div>
                            {properties.userName}
                            <br />
                            <Tooltip title={format}>
                                <Typography color='textSecondary' variant='caption'>
                                    {time}
                                </Typography>
                            </Tooltip>
                        </div>
                    );
                },
            },
        },
        {
            name: 'action',
            label: intl.formatMessage({
                id: 'Workflow.ApplicationUpdate.table.header.Action',
                defaultMessage: 'Action',
            }),
            options: {
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const dataRow = data[tableMeta.rowIndex];
                    const { referenceId } = dataRow;
                    return (
                        <div>
                            <Box component='span' m={1}>
                                <Button
                                    color='success'
                                    variant='contained'
                                    size='small'
                                    onClick={() => updateStatus(referenceId, 'APPROVED')}
                                    disabled={isUpdating}
                                >
                                    <CheckIcon />
                                    <FormattedMessage
                                        id='Workflow.ApplicationUpdate.table.button.approve'
                                        defaultMessage='Approve'
                                    />
                                    {(isUpdating && buttonValue === 'APPROVED') && <CircularProgress size={15} />}
                                </Button>
                                &nbsp;&nbsp;
                                <Button
                                    color='error'
                                    variant='contained'
                                    size='small'
                                    onClick={() => updateStatus(referenceId, 'REJECTED')}
                                    disabled={isUpdating}
                                >
                                    <ClearIcon />
                                    <FormattedMessage
                                        id='Workflow.ApplicationUpdate.table.button.reject'
                                        defaultMessage='Reject'
                                    />
                                    {(isUpdating && buttonValue === 'REJECTED') && <CircularProgress size={15} />}
                                </Button>
                            </Box>
                        </div>
                    );
                },
            },
        },
    ];

    const addButtonProps = {};
    const addButtonOverride = null;
    const noDataMessage = (
        <FormattedMessage
            id='AdminPages.Addons.ListBase.nodata.message'
            defaultMessage='No items yet'
        />
    );

    const searchActive = true;
    const searchPlaceholder = intl.formatMessage({
        id: 'Workflow.applicationUpdate.search.default',
        defaultMessage: 'Search by Application, Throttling Policy or Creator',
    });

    const filterData = (event) => {
        setSearchText(event.target.value);
    };

    const columns = [
        ...columProps,
    ];

    const options = {
        filterType: 'checkbox',
        selectableRows: 'none',
        filter: false,
        search: false,
        print: false,
        download: false,
        viewColumns: false,
        customToolbar: null,
        responsive: 'vertical',
        searchText,
        expandableRows: true,
        renderExpandableRow: (rowData, rowMeta) => {
            const rowIndex = rowMeta.dataIndex;
            const fullRow = data[rowIndex];
            const changes = fullRow.changes || [];

            return (
                <TableRow>
                    <TableCell
                        style={{
                            padding: '16px',
                            borderBottom: 'none',
                        }}
                        colSpan={rowData.length + 1}
                    >
                        <TableContainer>
                            <Table
                                size='small'
                                aria-label='changes'
                                sx={{
                                    tableLayout: 'fixed',
                                    width: '100%',
                                    '& .MuiTableCell-root:not(:last-child)': {
                                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                                    },
                                    '& .MuiTableCell-head': {
                                        borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                    },
                                    '& .MuiTableCell-body': {
                                        borderBottom: 'none',
                                        wordBreak: 'break-word',
                                    },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        {/* Key change: Define column widths */}
                                        <TableCell sx={{ width: '30%' }}>
                                            <strong>Changed Field</strong>
                                        </TableCell>
                                        <TableCell sx={{ width: '35%' }}>
                                            <strong>Old Value</strong>
                                        </TableCell>
                                        <TableCell sx={{ width: '35%' }}>
                                            <strong>New Value</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {changes.length > 0 ? (
                                        changes.map((change) => (
                                            <TableRow key={change.referenceId}>
                                                <TableCell component='th' scope='row'>
                                                    {change.attributeName?.trim() || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {change.current?.trim() || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {change.expected?.trim() || 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                align='center'
                                                style={{ borderBottom: 'none' }}
                                            >
                                                No changes to display.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TableCell>
                </TableRow>
            );
        },
        textLabels: {
            body: {
                noMatch: intl.formatMessage({
                    id: 'Mui.data.table.search.no.records.found',
                    defaultMessage: 'Sorry, no matching records found',
                }),
            },
            pagination: {
                rowsPerPage: intl.formatMessage({
                    id: 'Mui.data.table.pagination.rows.per.page',
                    defaultMessage: 'Rows per page:',
                }),
                displayRows: intl.formatMessage({
                    id: 'Mui.data.table.pagination.display.rows',
                    defaultMessage: 'of',
                }),
            },
        },
    };
    if (data && data.length === 0) {
        return (
            <ContentBase
                {...pageProps}
                pageStyle='small'
            >
                <Card>
                    <CardContent>
                        <Typography gutterBottom variant='h5' component='h2'>
                            <FormattedMessage
                                id='Workflow.ApplicationUpdate.List.empty.title.applicationupdates'
                                defaultMessage='Application Update'
                            />
                        </Typography>
                        <Typography variant='body2' color='textSecondary' component='p'>
                            <FormattedMessage
                                id='Workflow.ApplicationUpdate.List.empty.content.applicationupdates'
                                defaultMessage='There are no pending workflow requests for application update.'
                            />
                        </Typography>
                    </CardContent>
                    <CardActions>
                        {addButtonOverride || (
                            // eslint-disable-next-line react/no-unknown-property
                            <span updateList={fetchData} {...addButtonProps} />
                        )}
                    </CardActions>
                </Card>
            </ContentBase>
        );
    }
    if (!hasListPermission) {
        return (
            <WarningBase
                pageProps={pageProps}
                title={(
                    <FormattedMessage
                        id='Workflow.ApplicationUpdate.permission.denied.title'
                        defaultMessage='Permission Denied'
                    />
                )}
                content={(
                    <FormattedMessage
                        id='Workflow.ApplicationUpdate.permission.denied.content'
                        defaultMessage={'You dont have enough permission to view Application Update - '
                            + 'Approval Tasks. Please contact the site administrator.'}
                    />
                )}
            />
        );
    }
    if (!errorMessage && !data) {
        return (
            <ContentBase pageStyle='paperLess'>
                <InlineProgress />
            </ContentBase>

        );
    }
    if (errorMessage) {
        return (
            <ContentBase {...pageProps}>
                <MUIAlert severity='error'>{errorMessage}</MUIAlert>
            </ContentBase>

        );
    }
    return (
        <>
            <ContentBase {...pageProps}>
                {(searchActive || addButtonProps) && (
                    <AppBar position='static' color='default' elevation={0}>
                        <Toolbar>
                            <Grid container spacing={2} alignItems='center'>
                                <Grid item>
                                    {searchActive && (<SearchIcon color='inherit' />)}
                                </Grid>
                                <Grid item xs>
                                    {searchActive && (
                                        <TextField
                                            variant='standard'
                                            fullWidth
                                            placeholder={searchPlaceholder}
                                            sx={(theme) => ({
                                                '& .search-input': {
                                                    fontSize: theme.typography.fontSize,
                                                },
                                            })}
                                            InputProps={{
                                                disableUnderline: true,
                                                className: 'search-input',
                                            }}
                                            onChange={filterData}
                                        />
                                    )}
                                </Grid>
                                <Grid item>
                                    {addButtonOverride || (
                                        <span
                                            // eslint-disable-next-line react/no-unknown-property
                                            updateList={fetchData}
                                            {...addButtonProps}
                                        />
                                    )}
                                    <Tooltip title={(
                                        <FormattedMessage
                                            id='AdminPages.Addons.ListBase.reload'
                                            defaultMessage='Reload'
                                        />
                                    )}
                                    >
                                        <IconButton onClick={fetchData} size='large'>
                                            <RefreshIcon color='inherit' />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                )}
                {data && data.length > 0 && (
                    <MUIDataTable
                        title={null}
                        data={data}
                        columns={columns}
                        options={options}
                    />
                )}
                {data && data.length === 0 && (
                    <div>
                        <Typography color='textSecondary' align='center'>
                            {noDataMessage}
                        </Typography>
                    </div>
                )}
            </ContentBase>
        </>
    );
}

export default ListLabels;
