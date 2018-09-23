/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

const LOADING_INIT = 0;
const LOADING_NEW_DATA = 1;
const LOADING_SUCCESSFUL = 2;
const LOADING_ERROR = 3;

export default {
	INIT: LOADING_INIT,
	NEW_DATA: LOADING_NEW_DATA,
	SUCCESSFUL: LOADING_SUCCESSFUL,
	ERROR: LOADING_ERROR
};