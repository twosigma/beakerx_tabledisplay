/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as beakerx_tabledisplay from './index';
require('../css/table_display.css');
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { BEAKERX_MODULE_VERSION } from './version';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'beakerx_tabledisplay:plugin',
  requires: [IJupyterWidgetRegistry],
  activate: (app: JupyterFrontEnd, widgets: IJupyterWidgetRegistry): void => {
    widgets.registerWidget({
      name: 'beakerx_tabledisplay',
      version: BEAKERX_MODULE_VERSION,
      exports: beakerx_tabledisplay,
    });
  },
  autoStart: true,
};

export default {
  plugin,
};
